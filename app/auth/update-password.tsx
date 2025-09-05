import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { View, Text, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';

import TextField from '@/components/forms/TextField';
import { supabase } from '@/services/supabase';
import { updatePasswordSchema, UpdatePasswordFormData } from '@/src/lib/validations/auth';

// Add the missing updatePassword function
const updatePassword = async (userId: string, newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { success: !error, error: error?.message };
};

export default function UpdatePasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const params = useLocalSearchParams();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if we have the necessary parameters from the reset link
    if (!params.access_token && !params.refresh_token) {
      Alert.alert(
        'Ongeldige link',
        'Deze wachtwoord reset-link is ongeldig of verlopen. Vraag een nieuwe aan.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/reset-password'),
          },
        ]
      );
    }
  }, [params]);

  const onSubmit = async (data: UpdatePasswordFormData) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await updatePassword(data.password);
      
      Alert.alert(
        'Wachtwoord bijgewerkt',
        'Je wachtwoord is succesvol bijgewerkt. Je kunt nu inloggen met je nieuwe wachtwoord.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error) {
      console.error('Update password error:', error);
      
      let errorMessage = 'Er is een onbekende fout opgetreden';
      
      if (error instanceof Error) {
        if (error.message.includes('New password should be different')) {
          errorMessage = 'Het nieuwe wachtwoord moet anders zijn dan het huidige wachtwoord';
        } else if (error.message.includes('Password should be')) {
          errorMessage = 'Wachtwoord voldoet niet aan de eisen';
        } else if (error.message.includes('session_expired') || error.message.includes('invalid_grant')) {
          errorMessage = 'De reset-link is verlopen. Vraag een nieuwe reset-link aan.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (errorMessage.includes('verlopen')) {
        Alert.alert('Link verlopen', errorMessage, [
          {
            text: 'Nieuwe link aanvragen',
            onPress: () => router.replace('/auth/reset-password'),
          },
        ]);
      } else {
        Alert.alert('Fout', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Nieuw wachtwoord instellen</Text>
            <Text style={styles.subtitle}>
              Kies een sterk wachtwoord om je account te beveiligen
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              name="password"
              control={control}
              label="Nieuw wachtwoord"
              placeholder="Minimaal 8 tekens"
              secureTextEntry
              autoComplete="new-password"
              error={errors.password?.message}
              required
            />

            <TextField
              name="confirmPassword"
              control={control}
              label="Bevestig nieuw wachtwoord"
              placeholder="Herhaal je nieuwe wachtwoord"
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              required
            />

            <TouchableOpacity
              style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <Text style={styles.updateButtonText}>
                {isLoading ? 'Bezig met bijwerken...' : 'Wachtwoord bijwerken'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Wachtwoord eisen:</Text>
            <Text style={styles.requirementItem}>• Minimaal 8 tekens</Text>
            <Text style={styles.requirementItem}>• Minimaal 1 hoofdletter</Text>
            <Text style={styles.requirementItem}>• Minimaal 1 kleine letter</Text>
            <Text style={styles.requirementItem}>• Minimaal 1 cijfer</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  updateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  passwordRequirements: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    paddingLeft: 8,
  },
});