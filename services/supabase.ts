import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Database } from '../src/lib/types/supabase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get environment variables from Expo config or process.env
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? 
                   process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? 
                       process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key are required. Please check your environment variables or Expo config.'
  );
}

// Storage adapter for different platforms
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        if (typeof localStorage === 'undefined') {
          return null;
        }
        return localStorage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        if (typeof localStorage === 'undefined') {
          return;
        }
        localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        if (typeof localStorage === 'undefined') {
          return;
        }
        localStorage.removeItem(key);
      },
    };
  }
  
  return AsyncStorage;
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
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