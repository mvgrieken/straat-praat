import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { WordService } from '@/services/wordService';
import { COLORS } from '@/constants';

export default function WordDetailPage() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Word Detail</Text>
      <Text style={styles.subtitle}>Word ID: {id}</Text>
      <Text style={styles.description}>
        Deze pagina toont details van het woord met ID: {id}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 24,
  },
});
