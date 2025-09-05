import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

import { AuthAnalyticsService } from '@/services/authAnalyticsService';
import { LoginAttemptTracker } from '@/services/loginAttemptTracker';
import { MFAService } from '@/services/mfaService';
import { SecurityMonitor } from '@/services/securityMonitor';
import { SecurityReportingService } from '@/services/securityReportingService';
import { SessionManager } from '@/services/sessionManager';
import { supabase } from '@/services/supabase';
import { PlatformUtils } from '@/utils/platformUtils';

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
};

/**
 * Authentication context interface
 */
interface AuthContextType {
  /** Current authenticated user */
  user: User | null;
  /** Current session */
  session: Session | null;
  /** Loading state */
  loading: boolean;
  
  // Core authentication methods
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  /** Sign up with email, password and full name */
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  /** Sign out current user */
  signOut: () => Promise<void>;
  /** Reset password for email */
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  /** Update current user password */
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  
  // Enhanced security methods
  /** Get number of failed login attempts */
  getLoginAttempts: () => Promise<number>;
  /** Get account status (locked/unlocked) */
  getAccountStatus: (email: string) => Promise<{ locked: boolean; attempts: number }>;
  /** Unlock locked account */
  unlockAccount: (email: string) => Promise<boolean>;
  /** Get security health metrics */
  getSecurityHealth: () => Promise<{ score: number; issues: string[] }>;
  
  // MFA methods
  /** Check if MFA is enabled for user */
  isMFAEnabled: (userId: string) => Promise<boolean>;
  /** Setup MFA for user */
  setupMFA: (userId: string, email: string) => Promise<{ secret: string; qrCode: string }>;
  /** Verify MFA code */
  verifyMFACode: (userId: string, email: string, code: string) => Promise<{ success: boolean; backupCodes?: string[] }>;
  /** Verify backup code */
  verifyBackupCode: (userId: string, email: string, backupCode: string) => Promise<{ success: boolean }>;
  
  // Security reporting methods
  /** Generate security report for date range */
  generateSecurityReport: (startDate: Date, endDate: Date) => Promise<{ id: string; type: string; data: unknown }>;
  /** Get saved security reports */
  getSecurityReports: (type?: string, limit?: number) => Promise<{ id: string; type: string; data: unknown }[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component
 * 
 * Provides authentication state and methods to the entire app.
 * Handles user sessions, security monitoring, and MFA functionality.
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize security monitoring
  useEffect(() => {
    const securityMonitor = SecurityMonitor.getInstance();
    securityMonitor.startMonitoring().catch(error => {
      console.warn('Failed to start security monitoring:', error);
    });

    return () => {
      const securityMonitor = SecurityMonitor.getInstance();
      securityMonitor.stopMonitoring().catch(error => {
        console.warn('Failed to stop security monitoring:', error);
      });
    };
  }, []);

  // Get initial session and setup auth state listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          // Check if session needs refresh
          const refreshedSession = await SessionManager.refreshSessionIfNeeded(initialSession);
          setSession(refreshedSession);
          
          if (refreshedSession?.user) {
            await loadUserProfile(refreshedSession.user);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

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
        await clearLocalUserData();
      }
      
      setLoading(false);
    });

    // Set up periodic session refresh
    const refreshInterval = setInterval(async () => {
      if (session && mounted) {
        const refreshedSession = await SessionManager.refreshSessionIfNeeded(session);
        if (refreshedSession && mounted) {
          setSession(refreshedSession);
        }
      }
    }, 1000 * 60 * 15); // Refresh every 15 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  /**
   * Load user profile data from database or cache
   * 
   * @param authUser - Authenticated user from Supabase
   */
  const loadUserProfile = useCallback(async (authUser: User) => {
    try {
      // Try to load from local storage first
      let profileData = null;
      
      if (PlatformUtils.isWeb()) {
        const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        profileData = stored ? JSON.parse(stored) : null;
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
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
        const basicUser = {
          ...authUser,
          totalPoints: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
        };
        setUser(basicUser);
        return;
      }

      // Combine auth user with profile data
      const userWithProfile = {
        ...authUser,
        ...profile,
      };

      setUser(userWithProfile);

      // Cache the profile data
      await cacheUserProfile(userWithProfile);

    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setUser(authUser);
    }
  }, []);

  /**
   * Cache user profile data locally
   */
  const cacheUserProfile = useCallback(async (userData: User) => {
    try {
      if (PlatformUtils.isWeb()) {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userData));
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to cache user profile:', error);
    }
  }, []);

  /**
   * Clear local user data
   */
  const clearLocalUserData = useCallback(async () => {
    try {
      if (PlatformUtils.isWeb()) {
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      }
    } catch (error) {
      console.error('Failed to clear local user data:', error);
    }
  }, []);

  // Memoized authentication methods
  const signIn = useCallback(async (email: string, password: string) => {
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
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
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
  }, []);

  const signOut = useCallback(async () => {
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
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error };
    }
  }, []);

  // Enhanced security methods
  const getLoginAttempts = useCallback(async (): Promise<number> => {
    if (!user?.email) return 0;
    return await AuthAnalyticsService.getFailedLoginAttempts(user.id, 24);
  }, [user?.email]);

  const getAccountStatus = useCallback(async (email: string): Promise<{ locked: boolean; attempts: number }> => {
    return await LoginAttemptTracker.getAccountStatus(email);
  }, []);

  const unlockAccount = useCallback(async (email: string): Promise<boolean> => {
    return await LoginAttemptTracker.unlockAccount(email);
  }, []);

  const getSecurityHealth = useCallback(async (): Promise<{ score: number; issues: string[] }> => {
    const securityMonitor = SecurityMonitor.getInstance();
    return await securityMonitor.getSecurityMetrics();
  }, []);

  // MFA methods
  const isMFAEnabled = useCallback(async (userId: string): Promise<boolean> => {
    return await MFAService.isMFAEnabled(userId);
  }, []);

  const setupMFA = useCallback(async (userId: string, email: string): Promise<{ secret: string; qrCode: string }> => {
    return await MFAService.setupMFA(userId, email);
  }, []);

  const verifyMFACode = useCallback(async (userId: string, email: string, code: string): Promise<{ success: boolean; backupCodes?: string[] }> => {
    return await MFAService.verifyMFACode(userId, email, code);
  }, []);

  const verifyBackupCode = useCallback(async (userId: string, email: string, backupCode: string): Promise<{ success: boolean }> => {
    return await MFAService.verifyBackupCode(userId, email, backupCode);
  }, []);

  // Security reporting methods
  const generateSecurityReport = useCallback(async (startDate: Date, endDate: Date): Promise<{ id: string; type: string; data: unknown }> => {
    return await SecurityReportingService.generateComprehensiveReport(startDate, endDate);
  }, []);

  const getSecurityReports = useCallback(async (type?: string, limit?: number): Promise<{ id: string; type: string; data: unknown }[]> => {
    return await SecurityReportingService.getSavedReports(type, limit);
  }, []);

  // Memoized context value
  const value = useMemo<AuthContextType>(() => ({
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
  }), [
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
  ]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

/**
 * Hook to use authentication context
 * 
 * @returns Authentication context with user state and methods
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * const { user, signIn, signOut } = useAuth();
 * 
 * if (user) {
 *   return <Dashboard user={user} onSignOut={signOut} />;
 * } else {
 *   return <LoginForm onSignIn={signIn} />;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
