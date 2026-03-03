/**
 * IndexedDB-based persistence layer for Vigma.
 *
 * localStorage has a ~5 MB quota which is easily exceeded by canvas data
 * containing base64-encoded images.  IndexedDB can store hundreds of MB,
 * making it suitable for rich canvas projects.
 *
 * The module exposes a simple key-value API (get / set / remove) backed by a
 * single IndexedDB object store.  All methods are async and safe to call from
 * any context (they silently return `null` / `undefined` on error so callers
 * don't need to wrap every call in try-catch).
 */

const DB_NAME = 'vigma-storage'
const DB_VERSION = 1
const STORE_NAME = 'kv'

/** Key used for the main project data (pages + viewport). */
export const PAGES_KEY = 'vigma-pages'
/** Legacy single-page key kept for backward compat. */
export const PROJECT_KEY = 'vigma-project'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store a value in IndexedDB.  The value can be any structured-cloneable type
 * (string, object, Blob, etc.).
 */
export async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  } catch (e) {
    console.warn('[vigma-storage] idbSet failed', key, e)
  }
}

/**
 * Retrieve a value from IndexedDB.  Returns `null` if the key doesn't exist
 * or on any error.
 */
export async function idbGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => { db.close(); resolve(req.result ?? null) }
      req.onerror = () => { db.close(); reject(req.error) }
    })
  } catch (e) {
    console.warn('[vigma-storage] idbGet failed', key, e)
    return null
  }
}

/**
 * Remove a key from IndexedDB.
 */
export async function idbRemove(key: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(key)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  } catch (e) {
    console.warn('[vigma-storage] idbRemove failed', key, e)
  }
}
