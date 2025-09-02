import { supabase } from './supabase';

interface SecurityEventMetadata {
  ip_address?: string;
  user_agent?: string;
  location?: string;
  device_info?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SuspiciousActivityItem {
  ip: string;
  failedAttempts: number;
  lastAttempt: string;
  attempts: SecurityEvent[];
}

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  event_data: SecurityEventMetadata;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface AuthReport {
  total_events: number;
  login_successes: number;
  login_failures: number;
  unique_users: number;
  peak_login_times: string[];
  suspicious_ips: string[];
  average_session_duration: number;
}

export class AuthAnalyticsService {
  /**
   * Track user login attempt
   */
  static async trackLoginAttempt(
    email: string,
    success: boolean,
    metadata: SecurityEventMetadata
  ): Promise<void> {
    try {
      const eventData = {
        event_type: success ? 'login_success' : 'login_failure',
        user_id: null, // Will be updated after successful login
        event_data: {
          email,
          success,
          ...metadata,
          timestamp: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('auth_audit_log')
        .insert([eventData]);

      if (error) {
        console.error('Failed to log login attempt:', error);
      }
    } catch (error) {
      console.error('Error tracking login attempt:', error);
    }
  }

  /**
   * Track successful login and update user_id
   */
  static async trackSuccessfulLogin(userId: string, metadata: SecurityEventMetadata): Promise<void> {
    try {
      // Find the most recent login_success event for this user
      const { data: recentEvents, error: fetchError } = await supabase
        .from('auth_audit_log')
        .select('id')
        .eq('event_type', 'login_success')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Failed to fetch recent login events:', fetchError);
        return;
      }

      if (recentEvents && recentEvents.length > 0) {
        // Update the event with user_id
        const { error: updateError } = await supabase
          .from('auth_audit_log')
          .update({ user_id: userId })
          .eq('id', recentEvents[0].id);

        if (updateError) {
          console.error('Failed to update login event with user_id:', updateError);
        }
      }
    } catch (error) {
      console.error('Error tracking successful login:', error);
    }
  }

  /**
   * Get login statistics for a specific time period
   */
  static async getLoginStats(hours: number = 24): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueUsers: number;
    peakLoginTimes: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .in('event_type', ['login_success', 'login_failure']);

      if (error) {
        throw new Error(`Failed to fetch login stats: ${error.message}`);
      }

      const totalLogins = data.length;
      const successfulLogins = data.filter(log => log.event_type === 'login_success').length;
      const failedLogins = data.filter(log => log.event_type === 'login_failure').length;
      const uniqueUsers = new Set(data.filter(log => log.user_id).map(log => log.user_id)).size;

      // Calculate peak login times (simplified - just count by hour)
      const hourCounts: Record<number, number> = {};
      data.forEach(log => {
        const hour = new Date(log.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakLoginTimes = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

      return {
        totalLogins,
        successfulLogins,
        failedLogins,
        uniqueUsers,
        peakLoginTimes
      };
    } catch (error) {
      console.error('Error getting login stats:', error);
      return {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueUsers: 0,
        peakLoginTimes: []
      };
    }
  }

  static async trackSecurityEvent(eventType: string, userId: string | null, metadata: SecurityEventMetadata): Promise<void> {
    try {
      const eventData = {
        event_type: eventType,
        user_id: userId,
        event_data: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('auth_audit_log')
        .insert([eventData]);

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Error tracking security event:', error);
    }
  }

  static async getFailedLoginAttempts(userId: string, hours: number = 24): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'login_failure')
        .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());

      if (error) {
        throw new Error(`Failed to fetch failed login attempts: ${error.message}`);
      }

      return data.length;
    } catch (error) {
      console.error('Error getting failed login attempts:', error);
      return 0;
    }
  }

  static async getSuspiciousActivity(userId: string): Promise<SuspiciousActivityItem[]> {
    try {
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'login_failure')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch suspicious activity: ${error.message}`);
      }

      // Group by IP address to detect potential brute force attacks
      const ipGroups = data.reduce((acc, log) => {
        const ip = log.ip_address;
        if (!acc[ip]) {
          acc[ip] = [];
        }
        acc[ip].push(log);
        return acc;
      }, {} as Record<string, SecurityEvent[]>);

      // Return IPs with multiple failed attempts
      return Object.entries(ipGroups)
        .filter(([ip, attempts]) => attempts.length >= 3)
        .map(([ip, attempts]) => ({
          ip,
          failedAttempts: attempts.length,
          lastAttempt: attempts[0].created_at,
          attempts
        }));
    } catch (error) {
      console.error('Error getting suspicious activity:', error);
      return [];
    }
  }

  static async generateAuthReport(startDate: Date, endDate: Date): Promise<AuthReport> {
    try {
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to generate auth report: ${error.message}`);
      }

      const report: AuthReport = {
        total_events: data.length,
        login_successes: data.filter(log => log.event_type === 'login_success').length,
        login_failures: data.filter(log => log.event_type === 'login_failure').length,
        unique_users: new Set(data.map(log => log.user_id).filter(Boolean)).size,
        peak_login_times: [], // Placeholder, would need actual peak time calculation
        suspicious_ips: [], // Placeholder, would need actual suspicious IP detection
        average_session_duration: 0 // Placeholder, would need actual session duration tracking
      };

      return report;
    } catch (error) {
      console.error('Error generating auth report:', error);
      return {
        total_events: 0,
        login_successes: 0,
        login_failures: 0,
        unique_users: 0,
        peak_login_times: [],
        suspicious_ips: [],
        average_session_duration: 0
      };
    }
  }
}
