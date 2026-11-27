type StoragePort = {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
};
export function createSessionStorage(storage: StoragePort) {
  const prefix = 'buildwisp.auth.';
  return {
    getItem: (key: string) => storage.getItem(prefix + key),
    setItem: (key: string, value: string) => storage.setItem(prefix + key, value),
    removeItem: (key: string) => storage.removeItem(prefix + key),
  };
}
