import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EnvGate } from '@/components/EnvGate';
import { AuthProvider } from '@/hooks/useAuth';
import { SettingsProvider } from '@/hooks/useSettings';

import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: Platform.OS === 'web',
    },
  },
});

// Separate component for app setup that's wrapped by SettingsProvider
function AppSetup() {
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Hide splash screen once everything is loaded
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('Error during app setup:', error);
        await SplashScreen.hideAsync();
      }
    };

    setupApp();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <EnvGate>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SettingsProvider>
              <AppSetup />
              <Stack>
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="auth" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="onboarding/index" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen
                  name="quiz/[level]"
                  options={{
                    title: 'Quiz',
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="word/[id]"
                  options={{
                    title: 'Woorddetails',
                    presentation: 'modal',
                  }}
                />
              </Stack>
              <StatusBar style="auto" />
            </SettingsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </EnvGate>
  );
}
