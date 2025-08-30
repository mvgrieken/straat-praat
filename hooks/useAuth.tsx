import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/constants';
import { supabase } from '@/services/supabase';
import { User } from '@/types';
import { AuthAnalyticsService } from '@/services/authAnalyticsService';
import { LoginAttemptTracker } from '@/services/loginAttemptTracker';
import { SessionManager } from '@/services/sessionManager';
import { SecurityMonitor } from '@/services/securityMonitor';
import { MFAService } from '@/services/mfaService';
import { SecurityReportingService } from '@/services/securityReportingService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: SupabaseUser; session: Session }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ user: SupabaseUser | null; session: Session | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  // Enhanced security features
  getLoginAttempts: () => Promise<number>;
  getAccountStatus: (email: string) => Promise<any>;
  unlockAccount: (email: string) => Promise<boolean>;
  getSecurityHealth: () => Promise<any>;
  // MFA features
  isMFAEnabled: (userId: string) => Promise<boolean>;
  setupMFA: (userId: string, email: string) => Promise<any>;
  verifyMFACode: (userId: string, email: string, code: string) => Promise<any>;
  verifyBackupCode: (userId: string, email: string, backupCode: string) => Promise<any>;
  // Security reporting features
  generateSecurityReport: (startDate: Date, endDate: Date) => Promise<any>;
  getSecurityReports: (type?: string, limit?: number) => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize security monitoring
    SecurityMonitor.startMonitoring(5); // Check every 5 minutes

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Check if session needs refresh
        const refreshedSession = await SessionManager.refreshSessionIfNeeded(session);
        setSession(refreshedSession);
        if (refreshedSession?.user) {
          await loadUserProfile(refreshedSession.user);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Check if session needs refresh
        const refreshedSession = await SessionManager.refreshSessionIfNeeded(session);
        setSession(refreshedSession);
        
        if (refreshedSession?.user) {
          await loadUserProfile(refreshedSession.user);
          // Track successful login
          await AuthAnalyticsService.trackLoginAttempt(refreshedSession.user.id, {
            email: refreshedSession.user.email || '',
            success: true
          });
        }
      } else {
        setSession(null);
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

    // Set up periodic session refresh
    const refreshInterval = setInterval(async () => {
      if (session?.user) {
        const refreshedSession = await SessionManager.refreshSessionIfNeeded(session);
        if (refreshedSession && refreshedSession !== session) {
          setSession(refreshedSession);
        }
      }
    }, 4 * 60 * 1000); // Check every 4 minutes

    return () => {
      subscription.unsubscribe();
      SecurityMonitor.stopMonitoring();
      clearInterval(refreshInterval);
    };
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
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - we'll create the profile
        throw error;
      }

      let userProfile: User;

      if (!profile) {
        // Create new user profile (match DB schema: no unknown columns like email)
        const newProfileDb = {
          id: supabaseUser.id,
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
          .from('profiles')
          .insert([newProfileDb])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        // Map database schema to application schema
        userProfile = {
          id: createdProfile.id,
          email: supabaseUser.email ?? null,
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
          email: supabaseUser.email ?? null,
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
      
      // Check login attempt tracking before proceeding
      const attemptResult = await LoginAttemptTracker.trackLoginAttempt(email, false);
      if (attemptResult.locked) {
        throw new Error(attemptResult.message);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Track failed login attempt
        await LoginAttemptTracker.trackLoginAttempt(email, false);
        await AuthAnalyticsService.trackLoginAttempt(null, {
          email: email.trim().toLowerCase(),
          success: false,
          failureReason: error.message
        });
        throw new Error(error.message);
      }

      // Track successful login attempt
      await LoginAttemptTracker.trackLoginAttempt(email, true);
      await AuthAnalyticsService.trackLoginAttempt(data.user.id, {
        email: email.trim().toLowerCase(),
        success: true
      });

      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('useAuth signUp called with:', { email, password: '***', displayName });
    try {
      console.log('Setting loading to true in useAuth');
      setLoading(true);
      console.log('Calling supabase.auth.signUp');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            displayName: displayName?.trim() || null,
          },
          emailRedirectTo: Platform.OS === 'web' 
            ? `${window.location.origin}/auth/callback`
            : 'straat-praat://auth/callback',
        },
      });
      console.log('Supabase signUp response:', { data, error });

      if (error) {
        console.error('Supabase signUp error:', error);
        throw new Error(error.message);
      }

      console.log('SignUp successful, returning data');
      return data;
    } catch (error) {
      console.error('useAuth signUp catch error:', error);
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
      // Map app schema -> DB schema for update
      const dbUpdate: Record<string, any> = {
        display_name: updates.displayName ?? user.displayName,
        avatar_url: updates.avatarUrl ?? user.avatarUrl,
        level: updates.level ?? user.level,
        total_points: updates.totalPoints ?? user.totalPoints,
        current_streak: updates.currentStreak ?? user.currentStreak,
        longest_streak: updates.longestStreak ?? user.longestStreak,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedRows, error } = await supabase
        .from('profiles')
        .update(dbUpdate)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Map back DB -> app schema
      const updatedProfile: User = {
        id: user.id,
        email: user.email ?? null,
        displayName: updatedRows.display_name,
        avatarUrl: updatedRows.avatar_url,
        level: updatedRows.level,
        totalPoints: updatedRows.total_points,
        currentStreak: updatedRows.current_streak,
        longestStreak: updatedRows.longest_streak,
        createdAt: updatedRows.created_at,
        updatedAt: updatedRows.updated_at,
      };

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

  // Enhanced security methods
  const getLoginAttempts = async (): Promise<number> => {
    if (!user?.email) return 0;
    return await AuthAnalyticsService.getFailedLoginAttempts(user.id, 24);
  };

  const getAccountStatus = async (email: string): Promise<any> => {
    return await LoginAttemptTracker.getAccountStatus(email);
  };

  const unlockAccount = async (email: string): Promise<boolean> => {
    return await LoginAttemptTracker.unlockAccount(email);
  };

  const getSecurityHealth = async (): Promise<any> => {
    return await SecurityMonitor.checkSystemHealth();
  };

  // MFA methods
  const isMFAEnabled = async (userId: string): Promise<boolean> => {
    return await MFAService.isMFAEnabled(userId);
  };

  const setupMFA = async (userId: string, email: string): Promise<any> => {
    return await MFAService.setupMFA(userId, email);
  };

  const verifyMFACode = async (userId: string, email: string, code: string): Promise<any> => {
    return await MFAService.verifyMFACode(userId, email, code);
  };

  const verifyBackupCode = async (userId: string, email: string, backupCode: string): Promise<any> => {
    return await MFAService.verifyBackupCode(userId, email, backupCode);
  };

  // Security reporting methods
  const generateSecurityReport = async (startDate: Date, endDate: Date): Promise<any> => {
    return await SecurityReportingService.generateComprehensiveReport(startDate, endDate);
  };

  const getSecurityReports = async (type?: string, limit?: number): Promise<any[]> => {
    return await SecurityReportingService.getSavedReports(type, limit);
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
    // Enhanced security features
    getLoginAttempts,
    getAccountStatus,
    unlockAccount,
    getSecurityHealth,
    // MFA features
    isMFAEnabled,
    setupMFA,
    verifyMFACode,
    verifyBackupCode,
    // Security reporting features
    generateSecurityReport,
    getSecurityReports,
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
