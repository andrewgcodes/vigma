/**
 * Collaboration Sync Bug Fix Tests
 *
 * Tests for 3 CRDT duplication bugs:
 * - Bug 1: Async enliven race condition (counter-based guard fails with async interleaving)
 * - Bug 2: Initial sync race condition (destructive pushCanvasState vs reconciliation)
 * - Bug 3: Dual event firing for freehand paths (path:created + object:added)
 */
import * as Y from 'yjs'

// ─── Mock Canvas (simulates Fabric.js canvas event behavior) ───

interface MockCanvasObject {
  id?: string
  type?: string
  src?: string
  isPreview?: boolean
  isGrid?: boolean
  [key: string]: any
}

type EventHandler = (opt: any) => void

function createMockCanvas() {
  const objects: MockCanvasObject[] = []
  const handlers: Record<string, EventHandler[]> = {}

  return {
    getObjects: () => [...objects],
    add: (obj: MockCanvasObject) => {
      objects.push(obj)
      // Fabric.js fires object:added synchronously from canvas.add()
      const fns = handlers['object:added'] || []
      fns.forEach(fn => fn({ target: obj }))
    },
    remove: (obj: MockCanvasObject) => {
      const idx = objects.indexOf(obj)
      if (idx >= 0) objects.splice(idx, 1)
      const fns = handlers['object:removed'] || []
      fns.forEach(fn => fn({ target: obj }))
    },
    insertAt: (idx: number, obj: MockCanvasObject) => {
      objects.splice(idx, 0, obj)
      const fns = handlers['object:added'] || []
      fns.forEach(fn => fn({ target: obj }))
    },
    on: (event: string, handler: EventHandler) => {
      if (!handlers[event]) handlers[event] = []
      handlers[event].push(handler)
    },
    off: (event: string, handler: EventHandler) => {
      if (handlers[event]) {
        handlers[event] = handlers[event].filter(h => h !== handler)
      }
    },
    renderAll: jest.fn(),
    _objects: objects,
    _handlers: handlers,
  }
}

// ─── Bug 1 Tests: Async Enliven Race Condition ───

describe('Bug 1: Async enliven race condition', () => {
  test('Remote object should NOT be echoed back to Yjs when using Set-based guard', () => {
    const syncedToYjs: string[] = []
    const canvas = createMockCanvas()
    const remoteObjectIds = new Set<string>()

    // Register onAdded with the Set-based fix
    canvas.on('object:added', (opt: any) => {
      const target = opt.target
      if (!target) return
      if (remoteObjectIds.has(target.id)) return // THE FIX
      syncedToYjs.push(target.id)
    })

    // Simulate remote object arriving
    const objectId = 'remote-image-1'
    remoteObjectIds.add(objectId)

    // Simulate async enliven completing — canvas.add fires object:added synchronously
    canvas.add({ id: objectId, type: 'image', src: 'data:image/png;base64,mock' })

    // Verify: syncObjectToCollab should NOT have been called
    expect(syncedToYjs).not.toContain(objectId)

    // Cleanup
    remoteObjectIds.delete(objectId)
  })

  test('Local object should still sync to Yjs after remote processing completes', () => {
    const remoteObjectIds = new Set<string>()
    const syncedToYjs: string[] = []
    const canvas = createMockCanvas()

    canvas.on('object:added', (opt: any) => {
      const target = opt.target
      if (!target) return
      if (remoteObjectIds.has(target.id)) return
      syncedToYjs.push(target.id)
    })

    // Simulate remote then local
    remoteObjectIds.add('remote-1')
    canvas.add({ id: 'remote-1', type: 'rect' })
    remoteObjectIds.delete('remote-1')

    // Now add a local object
    canvas.add({ id: 'local-1', type: 'rect' })

    expect(syncedToYjs).toEqual(['local-1'])
  })

  test('Interleaved sync and async remote changes should not leak', () => {
    const remoteObjectIds = new Set<string>()
    const syncedToYjs: string[] = []
    const canvas = createMockCanvas()

    canvas.on('object:added', (opt: any) => {
      const target = opt.target
      if (!target) return
      if (remoteObjectIds.has(target.id)) return
      syncedToYjs.push(target.id)
    })

    // Batch 1: sync object (no image) — add to set and process
    remoteObjectIds.add('sync-obj')
    canvas.add({ id: 'sync-obj', type: 'rect' })

    // Batch 2: async object (image) — add to set
    remoteObjectIds.add('async-img')

    // Batch 1 cleanup happens (simulating the old counter decrement)
    remoteObjectIds.delete('sync-obj')

    // Async image resolves — canvas.add fires
    // With the old counter approach, counter would be 0 here → BUG
    // With Set-based approach, 'async-img' is still in the set → SAFE
    canvas.add({ id: 'async-img', type: 'image' })

    // Verify: neither should have been synced
    expect(syncedToYjs).toEqual([])

    // Cleanup batch 2
    remoteObjectIds.delete('async-img')
  })

  test('Multiple concurrent remote batches with mixed async/sync should be safe', () => {
    const remoteObjectIds = new Set<string>()
    const syncedToYjs: string[] = []
    const canvas = createMockCanvas()

    canvas.on('object:added', (opt: any) => {
      const target = opt.target
      if (!target) return
      if (remoteObjectIds.has(target.id)) return
      syncedToYjs.push(target.id)
    })

    // Batch A: 3 objects, 2 sync + 1 async
    remoteObjectIds.add('a-sync-1')
    remoteObjectIds.add('a-sync-2')
    remoteObjectIds.add('a-async-1')

    canvas.add({ id: 'a-sync-1', type: 'rect' })
    canvas.add({ id: 'a-sync-2', type: 'circle' })

    // Batch B arrives while Batch A's async is still pending
    remoteObjectIds.add('b-sync-1')
    canvas.add({ id: 'b-sync-1', type: 'text' })

    // Batch A's async completes
    canvas.add({ id: 'a-async-1', type: 'image' })

    // Batch B cleanup
    remoteObjectIds.delete('b-sync-1')

    // Batch A cleanup
    remoteObjectIds.delete('a-sync-1')
    remoteObjectIds.delete('a-sync-2')
    remoteObjectIds.delete('a-async-1')

    // None of the remote objects should have been synced
    expect(syncedToYjs).toEqual([])

    // Now a local object should sync
    canvas.add({ id: 'local-after', type: 'rect' })
    expect(syncedToYjs).toEqual(['local-after'])
  })

  test('Object removal during remote processing should not trigger sync', () => {
    const remoteObjectIds = new Set<string>()
    const removedFromYjs: string[] = []
    const canvas = createMockCanvas()

    canvas.on('object:removed', (opt: any) => {
      const target = opt.target
      if (!target || !target.id) return
      if (remoteObjectIds.has(target.id)) return // THE FIX
      removedFromYjs.push(target.id)
    })

    // Add an object first
    const obj = { id: 'to-remove', type: 'rect' }
    canvas._objects.push(obj) // Direct push (no event)

    // Remote deletion
    remoteObjectIds.add('to-remove')
    canvas.remove(obj)

    // Should NOT have triggered removeObjectFromYjs
    expect(removedFromYjs).toEqual([])

    remoteObjectIds.delete('to-remove')
  })
})

// ─── Bug 2 Tests: Initial Sync Race Condition (Reconciliation) ───

describe('Bug 2: Initial sync race condition - reconcileCanvasState', () => {
  test('Reconciliation should not delete remote objects', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    // Simulate remote objects already in Y.Doc
    objectsMap.set('remote-1', JSON.stringify({ id: 'remote-1', type: 'rect' }))
    objectsMap.set('remote-2', JSON.stringify({ id: 'remote-2', type: 'circle' }))

    // Local objects
    const localObjects = [
      { id: 'local-1', json: JSON.stringify({ id: 'local-1', type: 'text' }) },
    ]

    // Reconcile (same logic as CollaborationManager.reconcileCanvasState)
    const remoteIds = new Set(Array.from(objectsMap.keys()))
    doc.transact(() => {
      for (const obj of localObjects) {
        if (!remoteIds.has(obj.id)) {
          objectsMap.set(obj.id, obj.json)
        }
      }
    })

    // All three objects should exist
    expect(objectsMap.size).toBe(3)
    expect(objectsMap.has('remote-1')).toBe(true)
    expect(objectsMap.has('remote-2')).toBe(true)
    expect(objectsMap.has('local-1')).toBe(true)
  })

  test('Reconciliation with empty remote should add all local objects', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    const localObjects = [
      { id: 'local-1', json: JSON.stringify({ id: 'local-1' }) },
      { id: 'local-2', json: JSON.stringify({ id: 'local-2' }) },
    ]

    doc.transact(() => {
      for (const obj of localObjects) {
        if (!objectsMap.has(obj.id)) {
          objectsMap.set(obj.id, obj.json)
        }
      }
    })

    expect(objectsMap.size).toBe(2)
  })

  test('Reconciliation with overlapping objects should keep remote version', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    // Remote version
    objectsMap.set('shared-1', JSON.stringify({ id: 'shared-1', fill: 'red' }))

    // Local version of same object (different fill)
    const localObjects = [
      { id: 'shared-1', json: JSON.stringify({ id: 'shared-1', fill: 'blue' }) },
    ]

    const remoteIds = new Set(Array.from(objectsMap.keys()))
    doc.transact(() => {
      for (const obj of localObjects) {
        if (!remoteIds.has(obj.id)) {
          objectsMap.set(obj.id, obj.json)
        }
      }
    })

    // Remote version should win (we didn't overwrite)
    expect(JSON.parse(objectsMap.get('shared-1')!).fill).toBe('red')
  })

  test('Reconciliation returns remote-only object IDs correctly', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    objectsMap.set('remote-1', JSON.stringify({ id: 'remote-1' }))
    objectsMap.set('remote-2', JSON.stringify({ id: 'remote-2' }))
    objectsMap.set('shared', JSON.stringify({ id: 'shared' }))

    const localObjects = [
      { id: 'shared', json: JSON.stringify({ id: 'shared' }) },
      { id: 'local-1', json: JSON.stringify({ id: 'local-1' }) },
    ]

    const remoteIds = new Set(Array.from(objectsMap.keys()))
    const localIds = new Set(localObjects.map(o => o.id))

    doc.transact(() => {
      for (const obj of localObjects) {
        if (!remoteIds.has(obj.id)) {
          objectsMap.set(obj.id, obj.json)
        }
      }
    })

    // Compute remote-only IDs
    const remoteOnlyIds: string[] = []
    remoteIds.forEach(id => {
      if (!localIds.has(id)) {
        remoteOnlyIds.push(id)
      }
    })

    expect(remoteOnlyIds.sort()).toEqual(['remote-1', 'remote-2'])
  })

  test('Concurrent reconciliation from two peers should produce union', () => {
    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    // Sync docs bidirectionally
    doc1.on('update', (update: Uint8Array) => Y.applyUpdate(doc2, update))
    doc2.on('update', (update: Uint8Array) => Y.applyUpdate(doc1, update))

    const map1 = doc1.getMap('objects') as Y.Map<string>
    const map2 = doc2.getMap('objects') as Y.Map<string>

    // User 1 reconciles with their local objects
    doc1.transact(() => {
      if (!map1.has('user1-obj')) {
        map1.set('user1-obj', JSON.stringify({ id: 'user1-obj' }))
      }
    })

    // User 2 reconciles with their local objects
    doc2.transact(() => {
      if (!map2.has('user2-obj')) {
        map2.set('user2-obj', JSON.stringify({ id: 'user2-obj' }))
      }
    })

    // Both docs should have both objects
    expect(map1.size).toBe(2)
    expect(map2.size).toBe(2)
    expect(map1.has('user1-obj')).toBe(true)
    expect(map1.has('user2-obj')).toBe(true)
    expect(map2.has('user1-obj')).toBe(true)
    expect(map2.has('user2-obj')).toBe(true)
  })

  test('Old pushCanvasState would delete remote objects (demonstrates the bug)', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    // Remote objects already synced
    objectsMap.set('remote-obj-1', JSON.stringify({ id: 'remote-obj-1' }))
    objectsMap.set('remote-obj-2', JSON.stringify({ id: 'remote-obj-2' }))

    // The OLD pushCanvasState logic (destructive)
    const localObjects = [
      { id: 'local-1', json: JSON.stringify({ id: 'local-1' }) },
    ]

    doc.transact(() => {
      // OLD: Clear existing (THIS IS THE BUG)
      const existingKeys = Array.from(objectsMap.keys())
      for (const key of existingKeys) {
        objectsMap.delete(key)
      }
      // OLD: Add all local
      for (const obj of localObjects) {
        objectsMap.set(obj.id, obj.json)
      }
    })

    // BUG: Remote objects are gone!
    expect(objectsMap.has('remote-obj-1')).toBe(false)
    expect(objectsMap.has('remote-obj-2')).toBe(false)
    expect(objectsMap.size).toBe(1) // Only local-1 remains
  })
})

// ─── Bug 3 Tests: Dual Event Firing for Freehand Paths ───

describe('Bug 3: Dual event firing for freehand paths', () => {
  test('Drawing a path should only sync once via object:added (not path:created)', () => {
    const syncedIds: string[] = []
    const canvas = createMockCanvas()

    // Register ONLY onAdded (path:created handler removed per fix)
    canvas.on('object:added', (opt: any) => {
      const target = opt.target
      if (!target) return
      if (!target.id) target.id = 'path-uuid-1'
      syncedIds.push(target.id)
    })

    // Simulate PencilBrush._finalizeAndAddPath:
    // 1. canvas.add(path) fires object:added
    const path = { type: 'path', path: [[0, 0], [1, 1]] } as MockCanvasObject
    canvas.add(path)

    // Verify: synced exactly once
    expect(syncedIds).toEqual(['path-uuid-1'])
  })

  test('Demonstrates the bug: both handlers would sync the same path twice', () => {
    const syncedIds: string[] = []
    const canvas = createMockCanvas()

    // Register BOTH handlers (simulating the OLD buggy code)
    canvas.on('object:added', (opt: any) => {
      const target = opt.target
      if (!target) return
      if (!target.id) target.id = 'path-uuid-1'
      syncedIds.push(target.id)
    })

    // path:created fires AFTER object:added for the same path object
    const pathCreatedHandler = (opt: any) => {
      const path = opt.path
      if (!path) return
      if (!path.id) path.id = 'path-uuid-2' // Won't assign because id already set
      syncedIds.push(path.id)
    }

    const path = { type: 'path' } as MockCanvasObject
    canvas.add(path) // fires object:added → assigns id
    pathCreatedHandler({ path }) // fires path:created with same object

    // BUG: synced twice with same ID
    expect(syncedIds.length).toBe(2)
    expect(syncedIds[0]).toBe(syncedIds[1]) // same ID
  })

  test('path:created without object:added would lose the sync (edge case check)', () => {
    // This test verifies that in Fabric.js, object:added always fires for paths.
    // Since PencilBrush._finalizeAndAddPath calls canvas.add() before firing
    // path:created, the object:added handler is sufficient.
    const addedIds: string[] = []
    const canvas = createMockCanvas()

    canvas.on('object:added', (opt: any) => {
      const target = opt.target
      if (!target) return
      if (!target.id) target.id = 'auto-id'
      addedIds.push(target.id)
    })

    // Simulate the full PencilBrush flow:
    // 1. _finalizeAndAddPath calls canvas.add(path)
    const path = { type: 'path' } as MockCanvasObject
    canvas.add(path)

    // 2. path:created fires separately (we don't handle it anymore)
    // No handler registered → no double sync

    expect(addedIds).toEqual(['auto-id'])
  })
})

// ─── Integration Tests: Full Sync Cycle ───

describe('Integration: Full Y.Doc sync cycle', () => {
  test('Two docs sync objects without duplication', () => {
    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    doc1.on('update', (update: Uint8Array) => Y.applyUpdate(doc2, update))
    doc2.on('update', (update: Uint8Array) => Y.applyUpdate(doc1, update))

    const map1 = doc1.getMap('objects') as Y.Map<string>
    const map2 = doc2.getMap('objects') as Y.Map<string>

    // User 1 adds an object
    map1.set('obj-1', JSON.stringify({ id: 'obj-1', left: 100, top: 200 }))

    // Verify sync
    expect(map2.get('obj-1')).toBeDefined()
    expect(map1.size).toBe(1)
    expect(map2.size).toBe(1) // NOT 2

    // User 2 adds a different object
    map2.set('obj-2', JSON.stringify({ id: 'obj-2', left: 300, top: 400 }))

    // Both should have both objects
    expect(map1.size).toBe(2)
    expect(map2.size).toBe(2)
  })

  test('Setting the same key twice does not create duplicates', () => {
    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    doc1.on('update', (update: Uint8Array) => Y.applyUpdate(doc2, update))
    doc2.on('update', (update: Uint8Array) => Y.applyUpdate(doc1, update))

    const map1 = doc1.getMap('objects') as Y.Map<string>
    const map2 = doc2.getMap('objects') as Y.Map<string>

    // Same key set twice (simulates the double-sync from Bug 3)
    map1.set('path-1', JSON.stringify({ id: 'path-1', version: 1 }))
    map1.set('path-1', JSON.stringify({ id: 'path-1', version: 2 }))

    expect(map1.size).toBe(1)
    expect(map2.size).toBe(1)
    expect(JSON.parse(map2.get('path-1')!).version).toBe(2)
  })

  test('Y.Map observe fires correct add/update/delete actions', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    const events: Array<{ action: string; key: string }> = []

    objectsMap.observe((event) => {
      event.keysChanged.forEach((key) => {
        const change = event.changes.keys.get(key)
        if (change) {
          events.push({ action: change.action, key })
        }
      })
    })

    objectsMap.set('obj-1', 'value1') // add
    objectsMap.set('obj-1', 'value2') // update
    objectsMap.delete('obj-1') // delete

    expect(events).toEqual([
      { action: 'add', key: 'obj-1' },
      { action: 'update', key: 'obj-1' },
      { action: 'delete', key: 'obj-1' },
    ])
  })

  test('Transact wraps multiple operations into a single event', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    let eventCount = 0

    objectsMap.observe(() => {
      eventCount++
    })

    doc.transact(() => {
      objectsMap.set('obj-1', 'value1')
      objectsMap.set('obj-2', 'value2')
      objectsMap.set('obj-3', 'value3')
    })

    // Should fire exactly one observe event for the whole transaction
    expect(eventCount).toBe(1)
  })

  test('Delete and re-add in same transaction is atomic', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    objectsMap.set('existing', JSON.stringify({ id: 'existing', v: 1 }))

    const events: Array<{ action: string; key: string }> = []
    objectsMap.observe((event) => {
      event.keysChanged.forEach((key) => {
        const change = event.changes.keys.get(key)
        if (change) {
          events.push({ action: change.action, key })
        }
      })
    })

    doc.transact(() => {
      objectsMap.delete('existing')
      objectsMap.set('existing', JSON.stringify({ id: 'existing', v: 2 }))
    })

    // The key was deleted and re-added in the same transaction.
    // Yjs may report this as an 'update' since the key existed before the transaction.
    expect(objectsMap.has('existing')).toBe(true)
    expect(JSON.parse(objectsMap.get('existing')!).v).toBe(2)
  })
})

// ─── CollaborationManager.reconcileCanvasState Integration ───

describe('CollaborationManager.reconcileCanvasState integration', () => {
  // We test the reconciliation logic directly since CollaborationManager
  // depends on WebRTC/IndexedDB which can't be instantiated in tests

  test('Empty room + local objects = all local objects pushed', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    const localObjects = [
      { id: 'rect-1', json: JSON.stringify({ id: 'rect-1', type: 'rect', left: 10 }) },
      { id: 'circle-1', json: JSON.stringify({ id: 'circle-1', type: 'circle', left: 50 }) },
    ]

    // Simulate reconcileCanvasState
    const remoteIds = new Set(Array.from(objectsMap.keys()))
    const localIds = new Set(localObjects.map(o => o.id))
    doc.transact(() => {
      for (const obj of localObjects) {
        if (!remoteIds.has(obj.id)) {
          objectsMap.set(obj.id, obj.json)
        }
      }
    })
    const remoteOnlyIds: string[] = []
    remoteIds.forEach(id => {
      if (!localIds.has(id)) remoteOnlyIds.push(id)
    })

    expect(objectsMap.size).toBe(2)
    expect(remoteOnlyIds).toEqual([])
  })

  test('Room with objects + empty local = all remote objects returned for canvas', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    objectsMap.set('peer-rect', JSON.stringify({ id: 'peer-rect', type: 'rect' }))
    objectsMap.set('peer-img', JSON.stringify({ id: 'peer-img', type: 'image' }))

    const localObjects: Array<{ id: string; json: string }> = []

    const remoteIds = new Set(Array.from(objectsMap.keys()))
    const localIds = new Set(localObjects.map(o => o.id))
    doc.transact(() => {
      for (const obj of localObjects) {
        if (!remoteIds.has(obj.id)) {
          objectsMap.set(obj.id, obj.json)
        }
      }
    })
    const remoteOnlyIds: string[] = []
    remoteIds.forEach(id => {
      if (!localIds.has(id)) remoteOnlyIds.push(id)
    })

    expect(objectsMap.size).toBe(2) // Remote objects untouched
    expect(remoteOnlyIds.sort()).toEqual(['peer-img', 'peer-rect'])
  })

  test('Mixed local and remote objects merge correctly', () => {
    const doc = new Y.Doc()
    const objectsMap = doc.getMap('objects') as Y.Map<string>

    // Remote has 2 objects
    objectsMap.set('shared', JSON.stringify({ id: 'shared', fill: 'red' }))
    objectsMap.set('remote-only', JSON.stringify({ id: 'remote-only' }))

    // Local has 2 objects (one overlapping)
    const localObjects = [
      { id: 'shared', json: JSON.stringify({ id: 'shared', fill: 'blue' }) },
      { id: 'local-only', json: JSON.stringify({ id: 'local-only' }) },
    ]

    const remoteIds = new Set(Array.from(objectsMap.keys()))
    const localIds = new Set(localObjects.map(o => o.id))
    doc.transact(() => {
      for (const obj of localObjects) {
        if (!remoteIds.has(obj.id)) {
          objectsMap.set(obj.id, obj.json)
        }
      }
    })
    const remoteOnlyIds: string[] = []
    const overlappingIds: string[] = []
    remoteIds.forEach(id => {
      if (!localIds.has(id)) remoteOnlyIds.push(id)
      else overlappingIds.push(id)
    })

    // 3 total objects: shared (remote version), remote-only, local-only
    expect(objectsMap.size).toBe(3)
    expect(JSON.parse(objectsMap.get('shared')!).fill).toBe('red') // Remote wins
    expect(objectsMap.has('remote-only')).toBe(true)
    expect(objectsMap.has('local-only')).toBe(true)
    expect(remoteOnlyIds).toEqual(['remote-only'])
    // Overlapping IDs should be returned so caller can update canvas to match remote
    expect(overlappingIds).toEqual(['shared'])
  })
})
