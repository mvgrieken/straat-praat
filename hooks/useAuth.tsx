import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { supabase } from '@/services/supabase';
import { User } from '@/types';
import { STORAGE_KEYS } from '@/constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: SupabaseUser; session: Session }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ user: SupabaseUser | null; session: Session | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        // Clear local storage on sign out
        if (Platform.OS !== 'web') {
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        } else {
          localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // First try to load from cache
      let cachedProfile = null;
      if (Platform.OS !== 'web') {
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        cachedProfile = cached ? JSON.parse(cached) : null;
      } else {
        const cached = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        cachedProfile = cached ? JSON.parse(cached) : null;
      }

      if (cachedProfile && cachedProfile.id === supabaseUser.id) {
        setUser(cachedProfile);
      }

      // Fetch fresh profile from database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - we'll create the profile
        throw error;
      }

      let userProfile: User;

      if (!profile) {
        // Create new user profile
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email ?? null,
          display_name: supabaseUser.user_metadata?.displayName ?? null,
          avatar_url: supabaseUser.user_metadata?.avatar_url ?? null,
          level: 1,
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        // Map database schema to application schema
        userProfile = {
          id: createdProfile.id,
          email: createdProfile.email,
          displayName: createdProfile.display_name,
          avatarUrl: createdProfile.avatar_url,
          level: createdProfile.level,
          totalPoints: createdProfile.total_points,
          currentStreak: createdProfile.current_streak,
          longestStreak: createdProfile.longest_streak,
          createdAt: createdProfile.created_at,
          updatedAt: createdProfile.updated_at,
        };
      } else {
        // Map database schema to application schema  
        userProfile = {
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          level: profile.level,
          totalPoints: profile.total_points,
          currentStreak: profile.current_streak,
          longestStreak: profile.longest_streak,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        };
      }

      setUser(userProfile);

      // Cache profile
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(userProfile)
        );
      } else {
        localStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(userProfile)
        );
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Create a minimal profile from auth data
      const fallbackProfile: User = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        displayName: supabaseUser.user_metadata?.displayName ?? null,
        avatarUrl: null,
        level: 1,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(fallbackProfile);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            displayName: displayName?.trim() || null,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: Platform.OS === 'web'
          ? `${window.location.origin}/auth/reset-password`
          : 'straat-praat://auth/reset-password',
      }
    );

    if (error) {
      throw new Error(error.message);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedProfile = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update(updatedProfile)
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setUser(updatedProfile);

      // Update cache
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(updatedProfile)
        );
      } else {
        localStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(updatedProfile)
        );
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}