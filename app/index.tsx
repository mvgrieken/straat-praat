import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export default function IndexPage() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [session, loading]);

  // Show loading spinner while checking authentication
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
      <ActivityIndicator size="large" color={COLORS.primary[600]} />
    </View>
  );
}