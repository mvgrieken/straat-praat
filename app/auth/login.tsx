import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/src/lib/validations/auth';
import TextField from '@/components/forms/TextField';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      
      // Navigation will be handled by AuthProvider
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Er is een onbekende fout opgetreden';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Onjuiste e-mail of wachtwoord';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Bevestig eerst je e-mailadres via de link in je e-mail';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Te veel inlogpogingen. Probeer het later opnieuw';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Inloggen mislukt', errorMessage);
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welkom terug!</Text>
            <Text style={styles.subtitle}>
              Log in om je voortgang voort te zetten
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

            <TextField
              name="password"
              control={control}
              label="Wachtwoord"
              placeholder="Je wachtwoord"
              secureTextEntry
              autoComplete="password"
              error={errors.password?.message}
              required
            />

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.links}>
            <Link href="/auth/reset-password" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Wachtwoord vergeten?</Text>
              </TouchableOpacity>
            </Link>

            <View style={styles.signupLink}>
              <Text style={styles.signupText}>Nog geen account? </Text>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Registreer hier</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
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
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  links: {
    alignItems: 'center',
    gap: 16,
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  signupLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: '#6B7280',
    fontSize: 16,
  },
});