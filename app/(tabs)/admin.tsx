import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import AdminWordManager from '@/components/AdminWordManager';
import { ContentManagementInterface } from '@/components/ContentManagementInterface';

export default function AdminScreen() {
  const [showManager, setShowManager] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Beheer</Text>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setShowManager(true)}>
          <Text style={styles.toggleText}>Open Content Beheer</Text>
        </TouchableOpacity>
      </View>

      <AdminWordManager />

      <Modal visible={showManager} animationType="slide" onRequestClose={() => setShowManager(false)}>
        <ContentManagementInterface onClose={() => setShowManager(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleText: {
    color: 'white',
    fontWeight: '600',
  },
});
