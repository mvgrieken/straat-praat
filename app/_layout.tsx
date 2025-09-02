import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { SettingsProvider } from '@/hooks/useSettings';
import { EnvGate } from '@/components/EnvGate';

import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  const { requestPermissions } = useNotifications();

  useEffect(() => {
    const setupApp = async () => {
      try {
        // Request notification permissions
        await requestPermissions();
        
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
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
    </EnvGate>
  );
}