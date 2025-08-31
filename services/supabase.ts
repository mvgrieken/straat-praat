import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '../types/supabase';
import { validateEnvironment } from '../src/env';

// Validate and get environment variables
const { supabaseUrl, supabaseAnonKey } = validateEnvironment();
console.log('Supabase config:', { 
  supabaseUrl: supabaseUrl.substring(0, 20) + '...', 
  supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...' 
});

// Import platform-specific secure storage adapter
import StorageAdapter from './storage/secureStoreAdapter';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // Disable email confirmation for development
    flowType: 'pkce',
  },
});

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: Platform.OS === 'web' 
        ? `${window.location.origin}/auth/callback`
        : 'straat-praat://auth/callback',
      // Disable email confirmation for development
      data: {
        email_confirm: false
      }
    }
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: Platform.OS === 'web' 
      ? `${window.location.origin}/auth/reset-password`
      : 'straat-praat://auth/reset-password',
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const getCurrentSession = () => {
  return supabase.auth.getSession();
};

// Database helpers with Row Level Security
export const getSlangWords = async (limit = 20, offset = 0, search?: string) => {
  let query = supabase
    .from('slang_words')
    .select('*')
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });
    
  if (search) {
    query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch slang words: ${error.message}`);
  }
  
  return data;
};

export const getWordById = async (id: string) => {
  const { data, error } = await supabase
    .from('slang_words')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    throw new Error(`Failed to fetch word: ${error.message}`);
  }
  
  return data;
};

export const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select(`
      *,
      slang_words (
        id,
        word,
        meaning,
        difficulty
      )
    `)
    .eq('user_id', userId);
    
  if (error) {
    throw new Error(`Failed to fetch user progress: ${error.message}`);
  }
  
  return data;
};

export const updateUserProgress = async (
  userId: string,
  wordId: string,
  progress: {
    masteryLevel?: number;
    timesReviewed?: number;
    correctAnswers?: number;
    incorrectAnswers?: number;
  }
) => {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      word_id: wordId,
      ...progress,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to update user progress: ${error.message}`);
  }
  
  return data;
};

// Real-time subscriptions
export const subscribeToWordUpdates = (callback: (payload: any) => void) => {
  return supabase
    .channel('slang_words_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'slang_words' },
      callback
    )
    .subscribe();
};

export const subscribeToUserProgress = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`user_progress_${userId}`)
    .on('postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_progress',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};

// Error handling wrapper for API calls
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  errorContext: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${errorContext}:`, error);
    
    // Handle specific Supabase errors
    if (error instanceof Error) {
      if (error.message.includes('JWT')) {
        throw new Error('Je sessie is verlopen. Log opnieuw in.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Te veel verzoeken. Probeer het later opnieuw.');
      }
      if (error.message.includes('offline')) {
        throw new Error('Geen internetverbinding. Controleer je verbinding.');
      }
    }
    
    throw error;
  }
};
