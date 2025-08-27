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
import { signupSchema, SignupFormData } from '@/src/lib/validations/auth';
import TextField from '@/components/forms/TextField';
import CheckboxField from '@/components/forms/CheckboxField';

export default function SignupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    console.log('onSubmit called with data:', data);
    if (isLoading) {
      console.log('Already loading, returning early');
      return;
    }
    
    try {
      console.log('Setting loading to true');
      setIsLoading(true);
      console.log('Calling signUp with:', { email: data.email, password: data.password, displayName: data.displayName });
      const result = await signUp(data.email, data.password, data.displayName);
      console.log('SignUp result:', result);
      console.log('SignUp result.user:', result.user);
      console.log('SignUp result.session:', result.session);
      console.log('SignUp result.user?.email_confirmed_at:', result.user?.email_confirmed_at);
      
      if (result.user && !result.session) {
        console.log('Email verification required');
        // Email verification required
        Alert.alert(
          'Bevestig je e-mailadres',
          'We hebben een bevestigingslink naar je e-mailadres gestuurd. Klik op de link om je account te activeren.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      } else if (result.user && result.session) {
        console.log('Direct login successful, navigating to tabs');
        // Direct login (if email confirmation is disabled)
        router.replace('/(tabs)');
      } else {
        console.log('Unexpected result structure:', result);
        Alert.alert('Registratie voltooid', 'Je account is aangemaakt. Je kunt nu inloggen.');
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Er is een onbekende fout opgetreden';
      
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'Dit e-mailadres is al in gebruik. Probeer in te loggen.';
        } else if (error.message.includes('Password should be')) {
          errorMessage = 'Wachtwoord voldoet niet aan de eisen';
        } else if (error.message.includes('Unable to validate email')) {
          errorMessage = 'Ongeldig e-mailadres';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Registratie mislukt', errorMessage);
    } finally {
      console.log('Setting loading to false');
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
            <Text style={styles.title}>Account aanmaken</Text>
            <Text style={styles.subtitle}>
              Begin je taalreis met Straat Praat
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              name="displayName"
              control={control}
              label="Naam"
              placeholder="Je volledige naam"
              autoCapitalize="words"
              autoComplete="name"
              error={errors.displayName?.message}
            />

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
              placeholder="Minimaal 8 tekens"
              secureTextEntry
              autoComplete="new-password"
              error={errors.password?.message}
              required
            />

            <TextField
              name="confirmPassword"
              control={control}
              label="Bevestig wachtwoord"
              placeholder="Herhaal je wachtwoord"
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              required
            />

            <CheckboxField
              name="acceptTerms"
              control={control}
              label="Ik ga akkoord met de Algemene Voorwaarden en Privacybeleid"
              error={errors.acceptTerms?.message}
              required
            />

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? 'Bezig met registreren...' : 'Account aanmaken'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Al een account? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Log hier in</Text>
              </TouchableOpacity>
            </Link>
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 24,
  },
  signupButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signupButtonText: {
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
});