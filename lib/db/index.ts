// Gerenciador do banco de dados IndexedDB
// Funciona offline e sincroniza quando online

import { DB_NAME, DB_VERSION, STORES } from './schema';

class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Criar stores se não existirem
        if (!db.objectStoreNames.contains(STORES.users)) {
          db.createObjectStore(STORES.users, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.habits)) {
          const habitStore = db.createObjectStore(STORES.habits, { keyPath: 'id' });
          habitStore.createIndex('userId', 'userId', { unique: false });
          habitStore.createIndex('active', 'active', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.habitLogs)) {
          const logStore = db.createObjectStore(STORES.habitLogs, { keyPath: 'id' });
          logStore.createIndex('habitId', 'habitId', { unique: false });
          logStore.createIndex('userId', 'userId', { unique: false });
          logStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.tasks)) {
          const taskStore = db.createObjectStore(STORES.tasks, { keyPath: 'id' });
          taskStore.createIndex('userId', 'userId', { unique: false });
          taskStore.createIndex('category', 'category', { unique: false });
          taskStore.createIndex('completed', 'completed', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.pomodoroSessions)) {
          const pomodoroStore = db.createObjectStore(STORES.pomodoroSessions, { keyPath: 'id' });
          pomodoroStore.createIndex('userId', 'userId', { unique: false });
          pomodoroStore.createIndex('startTime', 'startTime', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.addictions)) {
          const addictionStore = db.createObjectStore(STORES.addictions, { keyPath: 'id' });
          addictionStore.createIndex('userId', 'userId', { unique: false });
          addictionStore.createIndex('active', 'active', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.addictionLogs)) {
          const addictionLogStore = db.createObjectStore(STORES.addictionLogs, { keyPath: 'id' });
          addictionLogStore.createIndex('addictionId', 'addictionId', { unique: false });
          addictionLogStore.createIndex('userId', 'userId', { unique: false });
          addictionLogStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.studySessions)) {
          const studyStore = db.createObjectStore(STORES.studySessions, { keyPath: 'id' });
          studyStore.createIndex('userId', 'userId', { unique: false });
          studyStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.flashcards)) {
          const flashcardStore = db.createObjectStore(STORES.flashcards, { keyPath: 'id' });
          flashcardStore.createIndex('userId', 'userId', { unique: false });
          flashcardStore.createIndex('deckId', 'deckId', { unique: false });
          flashcardStore.createIndex('nextReview', 'nextReview', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.flashcardDecks)) {
          const deckStore = db.createObjectStore(STORES.flashcardDecks, { keyPath: 'id' });
          deckStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.dailyLogs)) {
          const dailyLogStore = db.createObjectStore(STORES.dailyLogs, { keyPath: 'id' });
          dailyLogStore.createIndex('userId', 'userId', { unique: false });
          dailyLogStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.achievements)) {
          const achievementStore = db.createObjectStore(STORES.achievements, { keyPath: 'id' });
          achievementStore.createIndex('userId', 'userId', { unique: false });
          achievementStore.createIndex('unlocked', 'unlocked', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.rewards)) {
          const rewardStore = db.createObjectStore(STORES.rewards, { keyPath: 'id' });
          rewardStore.createIndex('userId', 'userId', { unique: false });
          rewardStore.createIndex('redeemed', 'redeemed', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.userStats)) {
          const statsStore = db.createObjectStore(STORES.userStats, { keyPath: 'id' });
          statsStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.timeBlocks)) {
          const timeBlockStore = db.createObjectStore(STORES.timeBlocks, { keyPath: 'id' });
          timeBlockStore.createIndex('userId', 'userId', { unique: false });
          timeBlockStore.createIndex('date', 'date', { unique: false });
          timeBlockStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.studySubjects)) {
          const subjectStore = db.createObjectStore(STORES.studySubjects, { keyPath: 'id' });
          subjectStore.createIndex('userId', 'userId', { unique: false });
          subjectStore.createIndex('active', 'active', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.studyTopics)) {
          const topicStore = db.createObjectStore(STORES.studyTopics, { keyPath: 'id' });
          topicStore.createIndex('userId', 'userId', { unique: false });
          topicStore.createIndex('subjectId', 'subjectId', { unique: false });
          topicStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.studySchedules)) {
          const scheduleStore = db.createObjectStore(STORES.studySchedules, { keyPath: 'id' });
          scheduleStore.createIndex('userId', 'userId', { unique: false });
          scheduleStore.createIndex('subjectId', 'subjectId', { unique: false });
          scheduleStore.createIndex('date', 'date', { unique: false });
          scheduleStore.createIndex('completed', 'completed', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.studyGoals)) {
          const goalStore = db.createObjectStore(STORES.studyGoals, { keyPath: 'id' });
          goalStore.createIndex('userId', 'userId', { unique: false });
          goalStore.createIndex('type', 'type', { unique: false });
          goalStore.createIndex('completed', 'completed', { unique: false });
        }

        // Sistema M - Gestão de Múltiplos Interesses
        if (!db.objectStoreNames.contains(STORES.mProjects)) {
          const mProjectStore = db.createObjectStore(STORES.mProjects, { keyPath: 'id' });
          mProjectStore.createIndex('userId', 'userId', { unique: false });
          mProjectStore.createIndex('pillar', 'pillar', { unique: false });
          mProjectStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.mProjectLogs)) {
          const mProjectLogStore = db.createObjectStore(STORES.mProjectLogs, { keyPath: 'id' });
          mProjectLogStore.createIndex('projectId', 'projectId', { unique: false });
          mProjectLogStore.createIndex('userId', 'userId', { unique: false });
          mProjectLogStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.mProjectReviews)) {
          const mProjectReviewStore = db.createObjectStore(STORES.mProjectReviews, { keyPath: 'id' });
          mProjectReviewStore.createIndex('userId', 'userId', { unique: false });
          mProjectReviewStore.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  async add<T>(storeName: string, data: T): Promise<string> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const db = new DatabaseManager();

// Helper para gerar IDs únicos
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Made with Bob
