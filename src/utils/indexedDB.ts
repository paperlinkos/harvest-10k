import { OfflineQueueItem, CachedAppState } from '../types';

const DB_NAME = 'Harvest10K_OfflineDB';
const DB_VERSION = 1;
const STORE_QUEUE = 'offline_submissions';
const STORE_CACHE = 'cached_app_state';

/**
 * Initializes and returns the IndexedDB instance for Harvest 10K offline storage.
 */
export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store 1: Offline submission queue items
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('centreId', 'centreId', { unique: false });
      }

      // Store 2: Cached snapshot of national totals & campaign records
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open Harvest 10K IndexedDB.'));
    };
  });
}

/**
 * Persists an offline submission item to IndexedDB.
 */
export async function saveQueuedItemToDB(item: OfflineQueueItem): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Fallback to LocalStorage for saving queued item:', err);
    fallbackSaveToLocalStorage(item);
  }
}

/**
 * Retrieves all queued offline submission items from IndexedDB.
 */
export async function getQueuedItemsFromDB(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = req.result as OfflineQueueItem[];
        // Sort by creation time oldest first for FIFO synchronization
        items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Fallback to LocalStorage for getting queued items:', err);
    return fallbackGetFromLocalStorage();
  }
}

/**
 * Updates status of a queued offline item in IndexedDB.
 */
export async function updateQueuedItemStatusInDB(
  id: string,
  status: 'pending' | 'syncing' | 'failed',
  lastError?: string
): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as OfflineQueueItem | undefined;
        if (item) {
          item.status = status;
          if (lastError) item.lastError = lastError;
          if (status === 'failed') item.retryCount = (item.retryCount || 0) + 1;
          const putReq = store.put(item);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error updating item status:', err);
  }
}

/**
 * Removes a single item from the IndexedDB queue (e.g. upon successful sync or manual discard).
 */
export async function removeQueuedItemFromDB(id: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error removing queued item:', err);
    fallbackRemoveFromLocalStorage(id);
  }
}

/**
 * Clears all queued items from IndexedDB.
 */
export async function clearAllQueuedItemsFromDB(): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error clearing queued items:', err);
    try {
      localStorage.removeItem('harvest10k_offline_queue_fallback');
    } catch {}
  }
}

/**
 * Caches the current dashboard & campaign snapshot in IndexedDB for offline viewing.
 */
export async function saveAppStateSnapshotToDB(state: CachedAppState): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CACHE], 'readwrite');
      const store = tx.objectStore(STORE_CACHE);
      const record = { key: 'latest_snapshot', ...state };
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      localStorage.setItem('harvest10k_cached_snapshot', JSON.stringify(state));
    } catch {}
  }
}

/**
 * Retrieves the cached app state snapshot from IndexedDB.
 */
export async function getAppStateSnapshotFromDB(): Promise<CachedAppState | null> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CACHE], 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get('latest_snapshot');

      req.onsuccess = () => {
        if (req.result) {
          const { key, ...state } = req.result;
          resolve(state as CachedAppState);
        } else {
          resolve(fallbackGetSnapshotFromLocalStorage());
        }
      };
      req.onerror = () => {
        resolve(fallbackGetSnapshotFromLocalStorage());
      };
    });
  } catch {
    return fallbackGetSnapshotFromLocalStorage();
  }
}

// --- LocalStorage Fallbacks in case IndexedDB is blocked in sandboxed frames ---

const LS_QUEUE_KEY = 'harvest10k_offline_queue_fallback';
const LS_SNAPSHOT_KEY = 'harvest10k_cached_snapshot';

function fallbackSaveToLocalStorage(item: OfflineQueueItem) {
  try {
    const items = fallbackGetFromLocalStorage();
    const existingIdx = items.findIndex(i => i.id === item.id);
    if (existingIdx >= 0) {
      items[existingIdx] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(items));
  } catch {}
}

function fallbackGetFromLocalStorage(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(LS_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function fallbackRemoveFromLocalStorage(id: string) {
  try {
    const items = fallbackGetFromLocalStorage().filter(i => i.id !== id);
    localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(items));
  } catch {}
}

function fallbackGetSnapshotFromLocalStorage(): CachedAppState | null {
  try {
    const raw = localStorage.getItem(LS_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
