import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function OnboardingPage() {
  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welkom bij Straat-Praat</Text>
      <Text style={styles.subtitle}>Onboarding</Text>
      <Text style={styles.description}>
        Welkom bij de Straat-Praat applicatie! Hier leer je meer over de app en hoe je deze kunt gebruiken.
      </Text>
      
      <View style={styles.features}>
        <Text style={styles.featureTitle}>Features:</Text>
        <Text style={styles.feature}>• Leer Nederlandse straattaal</Text>
        <Text style={styles.feature}>• Doe quizzen om je kennis te testen</Text>
        <Text style={styles.feature}>• Bekijk woorden van de dag</Text>
        <Text style={styles.feature}>• Volg je voortgang</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>Start App</Text>
      </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  feature: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
    paddingLeft: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
