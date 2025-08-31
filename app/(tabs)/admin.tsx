import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdminWordManager from '@/components/AdminWordManager';

export default function AdminScreen() {
  return (
    <View style={styles.container}>
      <AdminWordManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
