import { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';
import { AuthAnalyticsService } from '@/services/authAnalyticsService';
import { SessionManager } from '@/services/sessionManager';
import { LoginAttemptTracker } from '@/services/loginAttemptTracker';
import { SecurityMonitor } from '@/services/securityMonitor';
import { MFAService } from '@/services/mfaService';
import { SecurityReportingService } from '@/services/securityReportingService';

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  
  // Enhanced security methods
  getLoginAttempts: () => Promise<number>;
  getAccountStatus: (email: string) => Promise<any>;
  unlockAccount: (email: string) => Promise<boolean>;
  getSecurityHealth: () => Promise<any>;
  
  // MFA methods
  isMFAEnabled: (userId: string) => Promise<boolean>;
  setupMFA: (userId: string, email: string) => Promise<any>;
  verifyMFACode: (userId: string, email: string, code: string) => Promise<any>;
  verifyBackupCode: (userId: string, email: string, backupCode: string) => Promise<any>;
  
  // Security reporting methods
  generateSecurityReport: (startDate: Date, endDate: Date) => Promise<any>;
  getSecurityReports: (type?: string, limit?: number) => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize security monitoring with new instance-based approach
    const securityMonitor = SecurityMonitor.getInstance();
    securityMonitor.startMonitoring().catch(error => {
      console.warn('Failed to start security monitoring:', error);
    });

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
      if (session) {
        const refreshedSession = await SessionManager.refreshSessionIfNeeded(session);
        if (refreshedSession) {
          setSession(refreshedSession);
        }
      }
    }, 1000 * 60 * 15); // Refresh every 15 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      // Stop security monitoring on cleanup
      const securityMonitor = SecurityMonitor.getInstance();
      securityMonitor.stopMonitoring();
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      // Try to load from local storage first
      let profileData = null;
      if (Platform.OS !== 'web') {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        profileData = stored ? JSON.parse(stored) : null;
      } else {
        const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        profileData = stored ? JSON.parse(stored) : null;
      }

      // If we have cached data and it's for the same user, use it
      if (profileData && profileData.id === authUser.id) {
        setUser(profileData);
        return;
      }

      // Fetch fresh data from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // Use basic user data if profile fetch fails
        setUser({
          ...authUser,
          totalPoints: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
        });
        return;
      }

      // Combine auth user with profile data
      const userWithProfile = {
        ...authUser,
        ...profile,
      };

      setUser(userWithProfile);

      // Cache the profile data
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userWithProfile));
      } else {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userWithProfile));
      }

    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setUser(authUser);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check if account is locked
      const accountStatus = await LoginAttemptTracker.getAccountStatus(email);
      if (accountStatus.isLocked) {
        return { error: { message: 'Account is temporarily locked. Please try again later.' } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Track failed login attempt
        if (data?.user?.id) {
          await AuthAnalyticsService.trackLoginAttempt(data.user.id, {
            email,
            success: false,
            error: error.message
          });
        }
        return { error };
      }

      // Track successful login
      if (data.user) {
        await AuthAnalyticsService.trackLoginAttempt(data.user.id, {
          email,
          success: true
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            displayName: fullName,
          },
        },
      });

      if (error) {
        return { error };
      }

      // Track successful registration
      if (data.user) {
        await AuthAnalyticsService.trackRegistration(data.user.id, {
          email,
          fullName
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Track sign out
      if (user) {
        await AuthAnalyticsService.trackLogout(user.id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error };
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
    const securityMonitor = SecurityMonitor.getInstance();
    return await securityMonitor.getSecurityMetrics();
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
    updatePassword,
    getLoginAttempts,
    getAccountStatus,
    unlockAccount,
    getSecurityHealth,
    isMFAEnabled,
    setupMFA,
    verifyMFACode,
    verifyBackupCode,
    generateSecurityReport,
    getSecurityReports,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
