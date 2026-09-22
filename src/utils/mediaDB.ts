import { TestimonyMediaItem } from '../types';

const MEDIA_DB_NAME = 'Harvest10K_MediaDB';
const MEDIA_DB_VERSION = 1;
const STORE_MEDIA_BLOBS = 'media_blobs';
const STORE_MEDIA_META = 'media_metadata';

export function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MEDIA_BLOBS)) {
        db.createObjectStore(STORE_MEDIA_BLOBS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA_META)) {
        const metaStore = db.createObjectStore(STORE_MEDIA_META, { keyPath: 'id' });
        metaStore.createIndex('createdAt', 'createdAt', { unique: false });
        metaStore.createIndex('mediaType', 'mediaType', { unique: false });
        metaStore.createIndex('isFeatured', 'isFeatured', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open MediaDB.'));
  });
}

export async function saveMediaBlobToDB(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MEDIA_BLOBS], 'readwrite');
      const store = tx.objectStore(STORE_MEDIA_BLOBS);
      const req = store.put({ id, blob, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[MediaDB] Could not save media blob:', err);
  }
}

export async function getMediaBlobFromDB(id: string): Promise<Blob | null> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MEDIA_BLOBS], 'readonly');
      const store = tx.objectStore(STORE_MEDIA_BLOBS);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[MediaDB] Could not retrieve media blob:', err);
    return null;
  }
}

export async function saveMediaMetaToDB(item: TestimonyMediaItem): Promise<void> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MEDIA_META], 'readwrite');
      const store = tx.objectStore(STORE_MEDIA_META);
      // Don't store large blob URLs in metadata store if they will be regenerated
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[MediaDB] Could not save media meta:', err);
  }
}

export async function getMediaMetaFromDB(): Promise<TestimonyMediaItem[]> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MEDIA_META], 'readonly');
      const store = tx.objectStore(STORE_MEDIA_META);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result as TestimonyMediaItem[];
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[MediaDB] Could not load media meta:', err);
    return [];
  }
}

export async function deleteMediaFromDB(id: string): Promise<void> {
  try {
    const db = await openMediaDB();
    const tx = db.transaction([STORE_MEDIA_BLOBS, STORE_MEDIA_META], 'readwrite');
    tx.objectStore(STORE_MEDIA_BLOBS).delete(id);
    tx.objectStore(STORE_MEDIA_META).delete(id);
  } catch (err) {
    console.warn('[MediaDB] Could not delete media:', err);
  }
}
