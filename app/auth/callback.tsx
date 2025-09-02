import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabase';

export default function AuthCallbackScreen() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { access_token, refresh_token, type } = useLocalSearchParams();

  const handleBackToLogin = () => router.replace('/auth/login');

  useEffect(() => {
    handleAuthCallback();
  }, [access_token, refresh_token, type]);

  const handleAuthCallback = async () => {
    try {
      const { 
        code, 
        access_token, 
        refresh_token, 
        type,
        error: urlError,
        error_description 
      } = params;

      // Handle URL-based errors
      if (urlError) {
        console.error('Auth callback error:', urlError, error_description);
        setError(typeof urlError === 'string' ? urlError : 'Authentication failed');
        return;
      }

      // Handle OAuth code exchange (PKCE flow)
      if (code && typeof code === 'string') {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Code exchange error:', error);
          setError(error.message);
          return;
        }
        
        // Success - navigate to protected area
        router.replace('/(tabs)');
        return;
      }

      // Handle password reset callback
      if (access_token && refresh_token && type === 'recovery') {
        // Set the session with the recovery tokens
        const { error } = await supabase.auth.setSession({
          access_token: typeof access_token === 'string' ? access_token : '',
          refresh_token: typeof refresh_token === 'string' ? refresh_token : '',
        });

        if (error) {
          console.error('Recovery session error:', error);
          setError(error.message);
          return;
        }

        // Navigate to password update screen
        router.replace({
          pathname: '/auth/update-password',
          params: { access_token, refresh_token }
        });
        return;
      }

      // Handle email confirmation
      if (access_token && refresh_token && type === 'signup') {
        const { error } = await supabase.auth.setSession({
          access_token: typeof access_token === 'string' ? access_token : '',
          refresh_token: typeof refresh_token === 'string' ? refresh_token : '',
        });

        if (error) {
          console.error('Signup confirmation error:', error);
          setError(error.message);
          return;
        }

        // Email confirmed, navigate to app
        router.replace('/(tabs)');
        return;
      }

      // No valid parameters found
      setError('Invalid callback parameters');
    } catch (err) {
      console.error('Auth callback error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Authenticatie fout</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text 
            style={styles.errorLink}
            onPress={handleBackToLogin}
          >
            Terug naar inloggen
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Bezig met authenticatie...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorLink: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});