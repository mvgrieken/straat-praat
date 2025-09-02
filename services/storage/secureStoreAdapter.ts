import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Re-export the platform-specific adapter
let adapter: StorageAdapter;

if (Platform.OS === 'web') {
  adapter = require('./secureStoreAdapter.web').default;
} else {
  adapter = require('./secureStoreAdapter.native').default;
}

export default adapter;