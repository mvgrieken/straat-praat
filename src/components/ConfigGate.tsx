import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { validateEnv } from '../config/validateEnv';

type Props = { 
  children: React.ReactNode;
};

export function ConfigGate({ children }: Props) {
  const result = validateEnv();

  if (!result.ok) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Configuration Error</Text>
            <Text style={styles.subtitle}>
              De app mist verplichte environment variabelen.
            </Text>
            
            {result.missing.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ontbrekende variabelen:</Text>
                {result.missing.map((key) => (
                  <Text key={key} style={styles.code}>
                    {key}
                  </Text>
                ))}
              </View>
            )}

            {result.errors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Validatie fouten:</Text>
                {result.errors.map((error, index) => (
                  <Text key={index} style={styles.error}>
                    {error.message}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lokale ontwikkeling:</Text>
              <Text style={styles.step}>1. Maak een <Text style={styles.code}>.env.local</Text> in de projectroot</Text>
              <Text style={styles.step}>2. Vul de ontbrekende variabelen in (zie README of <Text style={styles.code}>.env.local.example</Text>)</Text>
              <Text style={styles.step}>3. Herstart de development server</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Netlify deployment:</Text>
              <Text style={styles.step}>1. Ga naar Site settings → Build & Deploy → Environment</Text>
              <Text style={styles.step}>2. Voeg de ontbrekende variabelen toe (met EXPO_PUBLIC_ prefix)</Text>
              <Text style={styles.step}>3. Clear cache and redeploy</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verplichte variabelen:</Text>
              <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text>
              <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
            </View>

            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠️ Let op: Gebruik alleen publieke client-side variabelen. 
                Server secrets (zoals SERVICE_ROLE_KEY) mogen nooit in client code.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 12,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 4,
    borderRadius: 4,
    color: '#e83e8c',
    marginVertical: 2,
  },
  step: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  warning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
