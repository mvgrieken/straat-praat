import { Session } from '@supabase/supabase-js';

import { supabase } from './supabase';

export interface SessionValidationResult {
  isValid: boolean;
  reason?: 'no_session' | 'expired' | 'invalid';
  needsRefresh?: boolean;
  session?: Session;
}

export interface SessionMetrics {
  activeSessions: number;
  averageSessionDuration: number;
  sessionRefreshRate: number;
  expiredSessions: number;
}

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private static readonly WARNING_THRESHOLD = 15 * 60 * 1000; // 15 minutes

  static async validateSession(session: Session | null): Promise<SessionValidationResult> {
    if (!session) {
      return { isValid: false, reason: 'no_session' };
    }

    const now = Date.now();
    const expiresAt = session.expires_at * 1000;

    if (now >= expiresAt) {
      return { isValid: false, reason: 'expired' };
    }

    // Check if session needs refresh
    const needsRefresh = (expiresAt - now) < this.REFRESH_THRESHOLD;
    
    return {
      isValid: true,
      needsRefresh,
      session
    };
  }

  static async refreshSessionIfNeeded(session: Session): Promise<Session | null> {
    const validation = await this.validateSession(session);
    
    if (!validation.isValid) {
      return null;
    }

    if (validation.needsRefresh) {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Session refresh failed:', error);
          return null;
        }
        return data.session;
      } catch (error) {
        console.error('Session refresh error:', error);
        return null;
      }
    }

    return session;
  }

  static async getSessionWarningTime(session: Session): Promise<number | null> {
    const now = Date.now();
    const expiresAt = session.expires_at * 1000;
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry <= this.WARNING_THRESHOLD) {
      return timeUntilExpiry;
    }

    return null;
  }

  static async extendSession(session: Session): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session extension failed:', error);
        return null;
      }
      return data.session;
    } catch (error) {
      console.error('Session extension error:', error);
      return null;
    }
  }

  static async invalidateSession(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Session invalidation failed:', error);
      }
    } catch (error) {
      console.error('Session invalidation error:', error);
    }
  }

  static async getSessionMetrics(): Promise<SessionMetrics> {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          activeSessions: 0,
          averageSessionDuration: 0,
          sessionRefreshRate: 0,
          expiredSessions: 0
        };
      }

      // Calculate session duration
      const sessionStart = session.created_at ? new Date(session.created_at).getTime() : Date.now();
      const sessionDuration = Date.now() - sessionStart;

      // Check if session needs refresh
      const validation = await this.validateSession(session);
      const needsRefresh = validation.needsRefresh || false;

      return {
        activeSessions: 1, // For now, we only track the current session
        averageSessionDuration: sessionDuration,
        sessionRefreshRate: needsRefresh ? 1 : 0,
        expiredSessions: validation.isValid ? 0 : 1
      };
    } catch (error) {
      console.error('Error getting session metrics:', error);
      return {
        activeSessions: 0,
        averageSessionDuration: 0,
        sessionRefreshRate: 0,
        expiredSessions: 0
      };
    }
  }

  static async monitorSessionHealth(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }

      const validation = await this.validateSession(session);
      
      if (!validation.isValid) {
        return false;
      }

      // Check if session needs refresh
      if (validation.needsRefresh) {
        const refreshedSession = await this.refreshSessionIfNeeded(session);
        return refreshedSession !== null;
      }

      return true;
    } catch (error) {
      console.error('Session health check failed:', error);
      return false;
    }
  }

  static async setupSessionMonitoring(): Promise<void> {
    // Set up periodic session health checks
    setInterval(async () => {
      const isHealthy = await this.monitorSessionHealth();
      if (!isHealthy) {
        console.warn('Session health check failed - user may need to re-authenticate');
        // Could trigger a re-authentication flow here
      }
    }, 60000); // Check every minute

    // Set up session expiry warnings
    setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const warningTime = await this.getSessionWarningTime(session);
        if (warningTime !== null) {
          console.warn(`Session will expire in ${Math.round(warningTime / 1000 / 60)} minutes`);
          // Could show a user notification here
        }
      }
    }, 30000); // Check every 30 seconds
  }
}
