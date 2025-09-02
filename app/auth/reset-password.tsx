import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { TextField } from '@/components/forms/TextField';
import { resetPasswordSchema, ResetPasswordFormData } from '@/src/lib/validations/auth';

export default function ResetPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      setEmailSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Er is een onbekende fout opgetreden';
      
      if (error instanceof Error) {
        if (error.message.includes('Unable to validate email')) {
          errorMessage = 'Ongeldig e-mailadres';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Te veel verzoeken. Probeer het later opnieuw';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Fout', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (!email) return;
    
    try {
      setIsLoading(true);
      await resetPassword(email);
      Alert.alert('E-mail verstuurd', 'We hebben een nieuwe reset-link naar je e-mailadres gestuurd.');
    } catch (error) {
      Alert.alert('Fout', 'Er ging iets mis bij het versturen van de e-mail.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={64} color="#3B82F6" />
          </View>
          
          <Text style={styles.successTitle}>E-mail verzonden!</Text>
          <Text style={styles.successMessage}>
            We hebben een wachtwoord reset-link naar je e-mailadres gestuurd.
            Controleer je inbox en klik op de link om een nieuw wachtwoord in te stellen.
          </Text>
          
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendEmail}
            disabled={isLoading}
          >
            <Text style={styles.resendButtonText}>
              {isLoading ? 'Bezig...' : 'E-mail opnieuw versturen'}
            </Text>
          </TouchableOpacity>
          
          <Link href="/auth/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backButtonText}>Terug naar inloggen</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backLink}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            <Text style={styles.backLinkText}>Terug</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Wachtwoord vergeten?</Text>
            <Text style={styles.subtitle}>
              Geen probleem! Voer je e-mailadres in en we sturen je een link om je wachtwoord te resetten.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              name="email"
              control={control}
              label="E-mailadres"
              placeholder="je@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
              required
            />

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? 'Bezig met versturen...' : 'Reset-link versturen'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Weet je je wachtwoord weer? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Log in</Text>
              </TouchableOpacity>
            </Link>
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backLinkText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
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
  resetButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#6B7280',
    fontSize: 16,
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  resendButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});