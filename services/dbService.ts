import { WorkflowItemType, ChatMessage } from '../types';
import { INITIAL_WORKFLOW_ITEMS } from '../constants';

const DB_NAME = 'ProjectWorkflowDB';
const DB_VERSION = 1;
const WORKFLOW_STORE_NAME = 'workflowItems';
const CHAT_STORE_NAME = 'chatHistories';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(WORKFLOW_STORE_NAME)) {
        db.createObjectStore(WORKFLOW_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
        db.createObjectStore(CHAT_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
};

export const getWorkflowItems = async (): Promise<WorkflowItemType[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(WORKFLOW_STORE_NAME, 'readonly');
    const store = transaction.objectStore(WORKFLOW_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
        if (request.result && request.result.length > 0) {
            resolve(request.result);
        } else {
            // Populate with initial data if empty
            const populateTransaction = db.transaction(WORKFLOW_STORE_NAME, 'readwrite');
            const populateStore = populateTransaction.objectStore(WORKFLOW_STORE_NAME);
            INITIAL_WORKFLOW_ITEMS.forEach(item => populateStore.put(item));
            
            populateTransaction.oncomplete = () => resolve(INITIAL_WORKFLOW_ITEMS);
            populateTransaction.onerror = () => reject(populateTransaction.error);
        }
    };
  });
};

export const saveWorkflowItems = async (items: WorkflowItemType[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(WORKFLOW_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(WORKFLOW_STORE_NAME);
        
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
             items.forEach(item => {
                store.put(item);
            });
        };
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getChatHistory = async (key: string): Promise<ChatMessage[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHAT_STORE_NAME);
        const request = store.get(key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            resolve(request.result ? request.result.history : []);
        };
    });
};

export const saveChatHistory = async (key: string, history: ChatMessage[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHAT_STORE_NAME);
        store.put({ id: key, history: history });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const clearChatHistory = async (key: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHAT_STORE_NAME);
        store.delete(key);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};
