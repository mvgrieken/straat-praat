import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'sb_auth:';

interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const secureStoreAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      // Try SecureStore first (more secure for auth tokens)
      const result = await SecureStore.getItemAsync(`${STORAGE_PREFIX}${key}`);
      return result;
    } catch (error) {
      console.warn('SecureStore failed, falling back to AsyncStorage:', error);
      // Fallback to AsyncStorage if SecureStore fails
      try {
        return await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
      } catch (fallbackError) {
        console.error('Both SecureStore and AsyncStorage failed:', fallbackError);
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Try SecureStore first
      await SecureStore.setItemAsync(`${STORAGE_PREFIX}${key}`, value);
    } catch (error) {
      console.warn('SecureStore failed, falling back to AsyncStorage:', error);
      // Fallback to AsyncStorage
      try {
        await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
      } catch (fallbackError) {
        console.error('Both SecureStore and AsyncStorage failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.warn('SecureStore delete failed, trying AsyncStorage:', error);
      try {
        await AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      } catch (fallbackError) {
        console.error('Both SecureStore and AsyncStorage delete failed:', fallbackError);
      }
    }
  },
};

export default secureStoreAdapter;