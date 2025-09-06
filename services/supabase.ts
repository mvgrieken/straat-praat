import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '@/types/supabase';

// Direct hardcoded configuration - no environment variable complexity
const SUPABASE_URL = 'https://trrsgvxoylhcudtiimvb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnNndnhveWxoY3VkdGlpbXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQ3OTIsImV4cCI6MjA3MTc3MDc5Mn0.PG4cDu5UVUwE4Kp7NejdTcxdJDypkpdpQSO97Ipl8kQ';

console.log('Supabase config:', { 
  supabaseUrl: `${SUPABASE_URL.substring(0, 20)}...`, 
  supabaseAnonKey: `${SUPABASE_ANON_KEY.substring(0, 20)}...` 
});

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
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

interface WordUpdatePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: {
    id: string;
    word: string;
    meaning: string;
    difficulty: string;
    created_at: string;
    updated_at: string;
  };
  old: {
    id: string;
    word: string;
    meaning: string;
    difficulty: string;
    created_at: string;
    updated_at: string;
  };
}

interface UserProgressPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: {
    id: string;
    user_id: string;
    word_id: string;
    mastery_level: number;
    times_reviewed: number;
    correct_answers: number;
    incorrect_answers: number;
    last_reviewed_at: string;
    updated_at: string;
  };
  old: {
    id: string;
    user_id: string;
    word_id: string;
    mastery_level: number;
    times_reviewed: number;
    correct_answers: number;
    incorrect_answers: number;
    last_reviewed_at: string;
    updated_at: string;
  };
}

// Real-time subscriptions
export const subscribeToWordUpdates = (callback: (payload: WordUpdatePayload) => void) => {
  return supabase
    .channel('slang_words_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'slang_words' },
      callback
    )
    .subscribe();
};

export const subscribeToUserProgress = (userId: string, callback: (payload: UserProgressPayload) => void) => {
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
