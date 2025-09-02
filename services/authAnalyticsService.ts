import { supabase } from './supabase';
import { UserBehavior, LoginPattern, SecurityEvent, UserStats } from '@/types';

export interface LoginMetadata {
  email: string;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
  success: boolean;
}

export interface LoginStats {
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  successRate: number;
  lastLogin: string | null;
  averageLoginTime?: number;
}

export interface AuthMetrics {
  loginSuccessRate: number;
  averageLoginTime: number;
  activeSessions: number;
  failedLoginAttempts: number;
  uniqueUsers: number;
  peakLoginTimes: string[];
}

export class AuthAnalyticsService {
  static async trackLoginAttempt(userId: string | null, metadata: LoginMetadata): Promise<void> {
    try {
      const eventData = {
        event_type: metadata.success ? 'login_success' : 'login_failure',
        user_id: userId,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        event_data: {
          email: metadata.email,
          failure_reason: metadata.success ? null : metadata.failureReason,
          timestamp: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('auth_audit_log')
        .insert([eventData]);

      if (error) {
        console.error('Failed to log authentication event:', error);
      }
    } catch (error) {
      console.error('Error tracking login attempt:', error);
    }
  }

  static async getLoginStats(userId: string, days: number = 30): Promise<LoginStats> {
    try {
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch login stats: ${error.message}`);
      }

      const successfulLogins = data.filter(log => log.event_type === 'login_success').length;
      const failedLogins = data.filter(log => log.event_type === 'login_failure').length;

      return {
        totalAttempts: data.length,
        successfulLogins,
        failedLogins,
        successRate: data.length > 0 ? (successfulLogins / data.length) * 100 : 0,
        lastLogin: data.find(log => log.event_type === 'login_success')?.created_at || null
      };
    } catch (error) {
      console.error('Error getting login stats:', error);
      return {
        totalAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
        successRate: 0,
        lastLogin: null
      };
    }
  }

  static async getSystemAuthMetrics(days: number = 7): Promise<AuthMetrics> {
    try {
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        throw new Error(`Failed to fetch auth metrics: ${error.message}`);
      }

      const successfulLogins = data.filter(log => log.event_type === 'login_success').length;
      const failedLogins = data.filter(log => log.event_type === 'login_failure').length;
      const uniqueUsers = new Set(data.map(log => log.user_id).filter(Boolean)).size;

      // Calculate peak login times (hourly distribution)
      const hourlyDistribution = new Array(24).fill(0);
      data.forEach(log => {
        const hour = new Date(log.created_at).getHours();
        hourlyDistribution[hour]++;
      });

      const peakHours = hourlyDistribution
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(({ hour }) => `${hour}:00`);

      return {
        loginSuccessRate: data.length > 0 ? (successfulLogins / data.length) * 100 : 0,
        averageLoginTime: 0, // Would need to track actual login times
        activeSessions: 0, // Would need to track active sessions
        failedLoginAttempts: failedLogins,
        uniqueUsers,
        peakLoginTimes: peakHours
      };
    } catch (error) {
      console.error('Error getting system auth metrics:', error);
      return {
        loginSuccessRate: 0,
        averageLoginTime: 0,
        activeSessions: 0,
        failedLoginAttempts: 0,
        uniqueUsers: 0,
        peakLoginTimes: []
      };
    }
  }

  static async trackSecurityEvent(eventType: string, userId: string | null, metadata: any): Promise<void> {
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

  static async getSuspiciousActivity(userId: string): Promise<any[]> {
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
      }, {} as Record<string, any[]>);

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

  static async generateAuthReport(startDate: Date, endDate: Date): Promise<any> {
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

      const report = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        summary: {
          totalEvents: data.length,
          successfulLogins: data.filter(log => log.event_type === 'login_success').length,
          failedLogins: data.filter(log => log.event_type === 'login_failure').length,
          uniqueUsers: new Set(data.map(log => log.user_id).filter(Boolean)).size
        },
        dailyBreakdown: this.getDailyBreakdown(data),
        topIPs: this.getTopIPs(data),
        eventTypes: this.getEventTypeBreakdown(data)
      };

      return report;
    } catch (error) {
      console.error('Error generating auth report:', error);
      return null;
    }
  }

  private static getDailyBreakdown(data: any[]): any[] {
    const dailyData = data.reduce((acc, log) => {
      const date = new Date(log.created_at).toDateString();
      if (!acc[date]) {
        acc[date] = { date, successful: 0, failed: 0 };
      }
      if (log.event_type === 'login_success') {
        acc[date].successful++;
      } else if (log.event_type === 'login_failure') {
        acc[date].failed++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(dailyData);
  }

  private static getTopIPs(data: any[]): any[] {
    const ipCounts = data.reduce((acc, log) => {
      const ip = log.ip_address;
      if (ip) {
        acc[ip] = (acc[ip] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static getEventTypeBreakdown(data: any[]): any[] {
    const eventCounts = data.reduce((acc, log) => {
      acc[log.event_type] = (acc[log.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(eventCounts)
      .map(([eventType, count]) => ({ eventType, count }));
  }
}
