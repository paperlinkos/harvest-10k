import { OfflineQueueItem } from '../types';

const DB_NAME = 'harvest10k_offline_db';
const STORE_NAME = 'offline_queue';
const DB_VERSION = 1;
const LOCALSTORAGE_KEY = 'harvest10k_offline_queue_fallback';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getFallbackItems(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setFallbackItems(items: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}

export async function saveQueuedItemToDB(item: OfflineQueueItem): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const items = getFallbackItems().filter(i => i.id !== item.id);
    items.push(item);
    setFallbackItems(items);
  }
}

export async function getQueuedItemsFromDB(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openDB();
    return await new Promise<OfflineQueueItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return getFallbackItems();
  }
}

export async function removeQueuedItemFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const items = getFallbackItems().filter(i => i.id !== id);
    setFallbackItems(items);
  }
}

export async function clearAllQueuedItemsFromDB(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    setFallbackItems([]);
  }
}
