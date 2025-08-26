import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, useColorScheme } from 'react-native';

import { AppSettings, NotificationSettings } from '@/types';
import { STORAGE_KEYS, DEFAULT_APP_SETTINGS, DEFAULT_NOTIFICATION_SETTINGS } from '@/constants';

interface SettingsContextType {
  settings: AppSettings;
  notificationSettings: NotificationSettings;
  loading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>({
    ...DEFAULT_APP_SETTINGS,
    userId: '', // Will be set when user is available
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    ...DEFAULT_NOTIFICATION_SETTINGS,
    userId: '', // Will be set when user is available
  });
  const [loading, setLoading] = useState(true);

  // Resolve actual theme based on system preference
  const resolvedTheme = settings.theme === 'system' 
    ? (systemColorScheme || 'light')
    : settings.theme;

  useEffect(() => {
    loadSettings();
  }, []);

  const getStorage = () => {
    if (Platform.OS === 'web') {
      return {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
          return Promise.resolve();
        },
      };
    }
    return AsyncStorage;
  };

  const loadSettings = async () => {
    try {
      const storage = getStorage();
      
      const [storedSettings, storedNotificationSettings] = await Promise.all([
        storage.getItem(STORAGE_KEYS.SETTINGS),
        storage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS),
      ]);

      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }

      if (storedNotificationSettings) {
        const parsedNotificationSettings = JSON.parse(storedNotificationSettings);
        setNotificationSettings(prev => ({ ...prev, ...parsedNotificationSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);

      const storage = getStorage();
      await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Instellingen konden niet worden opgeslagen');
    }
  };

  const updateNotificationSettings = async (updates: Partial<NotificationSettings>) => {
    try {
      const newNotificationSettings = { ...notificationSettings, ...updates };
      setNotificationSettings(newNotificationSettings);

      const storage = getStorage();
      await storage.setItem(
        STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(newNotificationSettings)
      );
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Notificatie-instellingen konden niet worden opgeslagen');
    }
  };

  const resetSettings = async () => {
    try {
      const defaultSettings = { ...DEFAULT_APP_SETTINGS, userId: settings.userId };
      const defaultNotificationSettings = { 
        ...DEFAULT_NOTIFICATION_SETTINGS, 
        userId: notificationSettings.userId 
      };

      setSettings(defaultSettings);
      setNotificationSettings(defaultNotificationSettings);

      const storage = getStorage();
      await Promise.all([
        storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings)),
        storage.setItem(
          STORAGE_KEYS.NOTIFICATION_SETTINGS, 
          JSON.stringify(defaultNotificationSettings)
        ),
      ]);
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw new Error('Instellingen konden niet worden gereset');
    }
  };

  // Note: updateUserId functionality can be added if needed

  const value: SettingsContextType = {
    settings: {
      ...settings,
      theme: resolvedTheme, // Return resolved theme
    },
    notificationSettings,
    loading,
    updateSettings,
    updateNotificationSettings,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Hook for theme-aware styling
export function useThemeColors() {
  const { settings } = useSettings();
  
  const colors = {
    background: settings.theme === 'dark' ? '#111827' : '#ffffff',
    surface: settings.theme === 'dark' ? '#1f2937' : '#f9fafb',
    primary: '#0ea5e9',
    text: settings.theme === 'dark' ? '#ffffff' : '#111827',
    textSecondary: settings.theme === 'dark' ? '#9ca3af' : '#6b7280',
    border: settings.theme === 'dark' ? '#374151' : '#e5e7eb',
  };
  
  return colors;
}