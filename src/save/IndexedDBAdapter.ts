export class IndexedDBAdapter {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private version: number;

  constructor(dbName: string, version: number) {
    this.dbName = dbName;
    this.version = version;
  }

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('saves')) {
          const store = db.createObjectStore('saves', { keyPath: 'slotId' });
          store.createIndex('updatedAt', 'updatedAt');
          store.createIndex('syncStatus', 'syncStatus');
        }
        if (!db.objectStoreNames.contains('backups')) {
          const store = db.createObjectStore('backups', { keyPath: 'backupId' });
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'queueId', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    return this.transaction(storeName, 'readwrite', (store) => store.put(value));
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    return this.transaction(storeName, 'readonly', (store) => store.get(key)) as Promise<T | undefined>;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return this.transaction(storeName, 'readonly', (store) => store.getAll()) as Promise<T[]>;
  }

  async delete(storeName: string, key: string): Promise<void> {
    return this.transaction(storeName, 'readwrite', (store) => store.delete(key));
  }

  private transaction<T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('Database not opened')); return; }
      const tx = this.db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  async close(): Promise<void> { this.db?.close(); this.db = null; }
  isOpen(): boolean { return this.db !== null; }
}
