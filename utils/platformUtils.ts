import { Platform } from 'react-native';

/**
 * Platform utility functions for cross-platform compatibility
 */
export const PlatformUtils = {
  /**
   * Check if running on web platform
   */
  isWeb: (): boolean => Platform.OS === 'web',

  /**
   * Check if running on native platform (iOS or Android)
   */
  isNative: (): boolean => Platform.OS === 'ios' || Platform.OS === 'android',

  /**
   * Check if running on iOS
   */
  isIOS: (): boolean => Platform.OS === 'ios',

  /**
   * Check if running on Android
   */
  isAndroid: (): boolean => Platform.OS === 'android',

  /**
   * Get platform-specific value
   */
  select<T>(options: {
    ios?: T;
    android?: T;
    web?: T;
    default?: T;
  }): T | undefined {
    if (Platform.OS === 'ios' && options.ios !== undefined) return options.ios;
    if (Platform.OS === 'android' && options.android !== undefined) return options.android;
    if (Platform.OS === 'web' && options.web !== undefined) return options.web;
    return options.default;
  },

  /**
   * Get platform-specific storage adapter
   */
  getStorageAdapter() {
    if (Platform.OS === 'web') {
      return require('@/services/storage/secureStoreAdapter.web').default;
    } else {
      return require('@/services/storage/secureStoreAdapter.native').default;
    }
  },

  /**
   * Get platform-specific navigation behavior
   */
  getNavigationBehavior() {
    return {
      isWeb: Platform.OS === 'web',
      supportsDeepLinking: Platform.OS !== 'web',
      supportsHardwareBack: Platform.OS !== 'web',
    };
  }
};

/**
 * Platform-specific constants
 */
export const PLATFORM_CONSTANTS = {
  WEB: {
    STORAGE_PREFIX: 'sb_auth:',
    SUPPORTS_LOCAL_STORAGE: true,
    SUPPORTS_SESSION_STORAGE: true,
  },
  NATIVE: {
    STORAGE_PREFIX: 'sb_auth:',
    SUPPORTS_SECURE_STORE: true,
    SUPPORTS_ASYNC_STORAGE: true,
  }
} as const;

/**
 * Get platform-specific constant
 */
export function getPlatformConstant<T extends keyof typeof PLATFORM_CONSTANTS.WEB | keyof typeof PLATFORM_CONSTANTS.NATIVE>(
  key: T
): typeof PLATFORM_CONSTANTS.WEB[T] | typeof PLATFORM_CONSTANTS.NATIVE[T] {
  if (PlatformUtils.isWeb()) {
    return PLATFORM_CONSTANTS.WEB[key as keyof typeof PLATFORM_CONSTANTS.WEB];
  } else {
    return PLATFORM_CONSTANTS.NATIVE[key as keyof typeof PLATFORM_CONSTANTS.NATIVE];
  }
}
