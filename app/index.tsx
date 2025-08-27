import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/constants';

export default function IndexPage() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        // User is authenticated, go to tabs
        router.replace('/(tabs)');
      } else {
        // User is not authenticated, go to login
        router.replace('/auth/login');
      }
    }
  }, [loading, session]);

  // Show loading spinner while checking authentication
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
      <ActivityIndicator size="large" color={COLORS.primary[600]} />
    </View>
  );
}