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

const getBrowserStorage = (): BrowserLikeStorage | undefined => {
  if (typeof globalThis.localStorage === 'undefined') {
    return undefined;
  }

  return globalThis.localStorage;
};

const createNativeMmkvStorage = (): StateStorage | undefined => {
  if (Platform.OS === 'web') {
    return undefined;
  }

  try {
    const module = require('react-native-mmkv') as NativeKeyValueModule;
    const storage = new module.MMKV({ id: APP_STORE_STORAGE_KEY });

    return {
      getItem: (name) => storage.getString(name) ?? null,
      setItem: (name, value) => storage.set(name, value),
      removeItem: (name) => storage.delete(name),
    };
  } catch {
    return undefined;
  }
};

const createWebStorage = (): StateStorage | undefined => {
  const browserStorage = getBrowserStorage();

  if (!browserStorage) {
    return undefined;
  }

  return {
    getItem: (name) => browserStorage.getItem(name),
    setItem: (name, value) => browserStorage.setItem(name, value),
    removeItem: (name) => browserStorage.removeItem(name),
  };
};

export const appStorage: StateStorage =
  createNativeMmkvStorage() ??
  createWebStorage() ?? {
    getItem: (name) => memoryStorage.get(name) ?? null,
    setItem: (name, value) => {
      memoryStorage.set(name, value);
    },
    removeItem: (name) => {
      memoryStorage.delete(name);
    },
  };

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
