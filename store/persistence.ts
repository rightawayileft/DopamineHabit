import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

export const APP_STORE_STORAGE_KEY = 'dopaminehabit-app-store';

interface BrowserLikeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface NativeKeyValueStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  clearAll: () => void;
}

interface NativeKeyValueModule {
  MMKV: new (options?: { id?: string }) => NativeKeyValueStorage;
}

declare const require: (moduleName: string) => unknown;

const memoryStorage = new Map<string, string>();

export type PersistenceBackend = 'native-mmkv' | 'web-localStorage' | 'memory';

export interface PersistenceStatus {
  backend: PersistenceBackend;
  durable: boolean;
  message: string;
}

const getBrowserStorage = (): BrowserLikeStorage | undefined => {
  if (typeof globalThis.localStorage === 'undefined') {
    return undefined;
  }

  return globalThis.localStorage;
};

interface ResolvedStorage {
  storage: StateStorage;
  status: PersistenceStatus;
}

const createNativeMmkvStorage = (): ResolvedStorage | undefined => {
  if (Platform.OS === 'web') {
    return undefined;
  }

  try {
    const module = require('react-native-mmkv') as NativeKeyValueModule;
    const storage = new module.MMKV({ id: APP_STORE_STORAGE_KEY });

    return {
      storage: {
        getItem: (name) => storage.getString(name) ?? null,
        setItem: (name, value) => storage.set(name, value),
        removeItem: (name) => storage.delete(name),
      },
      status: {
        backend: 'native-mmkv',
        durable: true,
        message: 'Native MMKV storage is active.',
      },
    };
  } catch {
    return undefined;
  }
};

const createWebStorage = (): ResolvedStorage | undefined => {
  const browserStorage = getBrowserStorage();

  if (!browserStorage) {
    return undefined;
  }

  return {
    storage: {
      getItem: (name) => browserStorage.getItem(name),
      setItem: (name, value) => browserStorage.setItem(name, value),
      removeItem: (name) => browserStorage.removeItem(name),
    },
    status: {
      backend: 'web-localStorage',
      durable: true,
      message: 'Web localStorage is active.',
    },
  };
};

const createMemoryStorage = (): ResolvedStorage => ({
  storage: {
    getItem: (name) => memoryStorage.get(name) ?? null,
    setItem: (name, value) => {
      memoryStorage.set(name, value);
    },
    removeItem: (name) => {
      memoryStorage.delete(name);
    },
  },
  status: {
    backend: 'memory',
    durable: false,
    message: 'Memory-only storage is active. Export data before closing the app.',
  },
});

const resolvedStorage = createNativeMmkvStorage() ?? createWebStorage() ?? createMemoryStorage();

export const appStorage: StateStorage = resolvedStorage.storage;
export const persistenceStatus: PersistenceStatus = resolvedStorage.status;

export const resetPersistenceForTests = (): void => {
  memoryStorage.clear();
  appStorage.removeItem(APP_STORE_STORAGE_KEY);
};

export const readPersistedJsonForTests = <T>(key: string): T | undefined => {
  const value = appStorage.getItem(key);

  if (typeof value !== 'string') {
    return undefined;
  }

  return JSON.parse(value) as T;
};

export const writePersistedJsonForTests = <T>(key: string, value: T): void => {
  appStorage.setItem(key, JSON.stringify(value));
};
