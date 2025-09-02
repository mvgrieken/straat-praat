interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const STORAGE_PREFIX = 'sb_auth:';

const webStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof localStorage === 'undefined') {
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
      if (typeof localStorage === 'undefined') {
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
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error('Web storage removeItem failed:', error);
    }
  },
};

export default webStorageAdapter;