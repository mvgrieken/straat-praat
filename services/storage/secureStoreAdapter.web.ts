interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const STORAGE_PREFIX = 'sb_auth:';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const webStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (!isBrowser) {
        return null;
      }
      return localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error('Web storage getItem failed:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (!isBrowser) {
        throw new Error('localStorage not available');
      }
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
    } catch (error) {
      console.error('Web storage setItem failed:', error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (!isBrowser) {
        return;
      }
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error('Web storage removeItem failed:', error);
    }
  },
};

export default webStorageAdapter;