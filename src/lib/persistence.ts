/**
 * IndexedDB-based persistence for Vigma canvas data.
 *
 * localStorage has a ~5 MB quota which is easily exceeded by base64-encoded
 * images.  IndexedDB supports 50 MB+ and avoids QuotaExceededError problems.
 *
 * The module exposes simple get/set helpers that mirror the localStorage API
 * but use IndexedDB under the hood.  On read it falls back to localStorage so
 * that existing saved projects are automatically migrated on first load.
 */

const DB_NAME = 'vigma-persistence'
const DB_VERSION = 1
const STORE_NAME = 'kv'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Write a value to IndexedDB.
 * Also writes to localStorage as a best-effort fallback (for tiny payloads).
 */
export async function persistSet(key: string, value: string): Promise<void> {
  // Synchronous localStorage write first — critical for beforeunload.
  // When persistSet is fire-and-forget (e.g. from the auto-save interval or
  // beforeunload handler), the async IndexedDB write below may not complete
  // before the page is torn down. The synchronous localStorage write ensures
  // small-to-medium projects are saved immediately.
  try {
    localStorage.setItem(key, value)
  } catch {
    // QuotaExceededError is expected for large images — silently ignore.
    // IndexedDB below will handle the large payload.
  }

  // Then write to IndexedDB (large-data-safe, no practical quota limit)
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Read a value.  Prefers IndexedDB; falls back to localStorage so that
 * projects saved before the IndexedDB migration are still loaded.
 */
export async function persistGet(key: string): Promise<string | null> {
  try {
    const db = await openDB()
    const value = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve((req.result as string) ?? null)
      req.onerror = () => reject(req.error)
    })
    if (value !== null) return value
  } catch {
    // IndexedDB unavailable (e.g. private browsing in some browsers) — fall through
  }

  // Fallback: read from localStorage (legacy data)
  return localStorage.getItem(key)
}

/**
 * Remove a key from both IndexedDB and localStorage.
 */
export async function persistRemove(key: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // IndexedDB unavailable — ignore
  }
  localStorage.removeItem(key)
}
