const DB_NAME = 'jc-model-cache';
const STORE = 'models';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<ArrayBuffer | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      db.close();
      resolve(req.result as ArrayBuffer | undefined);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function idbPut(key: string, value: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getCachedModelBuffer(url: string): Promise<Uint8Array> {
  try {
    const cached = await idbGet(url);
    if (cached) {
      console.log('[modelCache] hit', url);
      return new Uint8Array(cached);
    }
  } catch (err) {
    console.warn('[modelCache] read failed, falling back to network', err);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch model (${res.status}): ${url}`);
  }
  const buffer = await res.arrayBuffer();

  try {
    await idbPut(url, buffer);
    console.log(`[modelCache] miss, cached ${buffer.byteLength} bytes`);
  } catch (err) {
    console.warn('[modelCache] write failed (continuing)', err);
  }

  return new Uint8Array(buffer);
}
