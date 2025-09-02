import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/constants';

export default function IndexPage() {
  const { session, loading } = useAuth();

  // Show loading spinner while checking authentication
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
      <ActivityIndicator size="large" color={COLORS.primary[600]} />
    </View>
  );
}