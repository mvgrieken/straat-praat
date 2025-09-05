import { SecurityEvent, EventType, EventSeverity } from '@/types';

import { AuthAnalyticsService } from './authAnalyticsService';
import { supabase } from './supabase';

export interface SecurityEvent {
  eventType: SecurityEventType;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export type SecurityEventType = 
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'account_locked'
  | 'account_unlocked'
  | 'suspicious_activity'
  | 'brute_force_attempt'
  | 'session_expired'
  | 'session_refreshed'
  | 'profile_updated'
  | 'security_settings_changed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'mfa_failure'
  | 'admin_action'
  | 'data_access'
  | 'permission_denied';

export class SecurityEventLogger {
  private static readonly CRITICAL_EVENTS: SecurityEventType[] = [
    'brute_force_attempt',
    'account_locked',
    'suspicious_activity'
  ];

  private static readonly HIGH_SEVERITY_EVENTS: SecurityEventType[] = [
    'login_failure',
    'mfa_failure',
    'permission_denied'
  ];

  static async logEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date()
      };

      // Log to audit trail
      await this.logToAuditTrail(securityEvent);

      // Log to analytics service
      await this.logToAnalytics(securityEvent);

      // Check if this is a critical event that needs immediate attention
      if (this.isCriticalEvent(securityEvent)) {
        await this.handleCriticalEvent(securityEvent);
      }

      // Log to console for development
      if (__DEV__) {
        console.log('Security Event:', {
          type: securityEvent.eventType,
          severity: securityEvent.severity,
          user: securityEvent.email || securityEvent.userId,
          timestamp: securityEvent.timestamp.toISOString(),
          metadata: securityEvent.metadata
        });
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private static async logToAuditTrail(event: SecurityEvent): Promise<void> {
    try {
      const eventData = {
        event_type: event.eventType,
        user_id: event.userId,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        event_data: {
          email: event.email,
          severity: event.severity,
          metadata: event.metadata,
          timestamp: event.timestamp.toISOString()
        }
      };

      const { error } = await supabase
        .from('auth_audit_log')
        .insert([eventData]);

      if (error) {
        console.error('Failed to log to audit trail:', error);
      }
    } catch (error) {
      console.error('Error logging to audit trail:', error);
    }
  }

  private static async logToAnalytics(event: SecurityEvent): Promise<void> {
    try {
      await AuthAnalyticsService.trackSecurityEvent(
        event.eventType,
        event.userId,
        {
          email: event.email,
          severity: event.severity,
          metadata: event.metadata,
          timestamp: event.timestamp.toISOString()
        }
      );
    } catch (error) {
      console.error('Error logging to analytics:', error);
    }
  }

  private static isCriticalEvent(event: SecurityEvent): boolean {
    return this.CRITICAL_EVENTS.includes(event.eventType) || 
           event.severity === 'critical';
  }

  private static async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    try {
      // Send alert to security monitoring
      await this.sendSecurityAlert(event);

      // Log critical event with additional details
      console.error('CRITICAL SECURITY EVENT:', {
        type: event.eventType,
        user: event.email || event.userId,
        ip: event.ipAddress,
        timestamp: event.timestamp.toISOString(),
        metadata: event.metadata
      });

    } catch (error) {
      console.error('Failed to handle critical event:', error);
    }
  }

  private static async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // This could integrate with external alerting systems
      // For now, we'll just log it
      const alertMessage = `Critical security event: ${event.eventType} for user ${event.email || event.userId}`;
      
      // In a production environment, this could send:
      // - Email alerts to security team
      // - Slack/Discord notifications
      // - SMS alerts
      // - Integration with SIEM systems
      
      console.warn('SECURITY ALERT:', alertMessage);
      
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  // Convenience methods for common security events
  static async logLoginSuccess(userId: string, email: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    await this.logEvent({
      eventType: 'login_success',
      userId,
      email,
      severity: 'low',
      metadata
    });
  }

  static async logLoginFailure(email: string, reason: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    await this.logEvent({
      eventType: 'login_failure',
      email,
      severity: 'high',
      metadata: {
        ...metadata,
        failureReason: reason
      }
    });
  }

  static async logAccountLocked(email: string, reason: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    await this.logEvent({
      eventType: 'account_locked',
      email,
      severity: 'critical',
      metadata: {
        ...metadata,
        lockReason: reason
      }
    });
  }

  static async logSuspiciousActivity(userId: string, email: string, activity: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    await this.logEvent({
      eventType: 'suspicious_activity',
      userId,
      email,
      severity: 'critical',
      metadata: {
        ...metadata,
        activity
      }
    });
  }

  static async logBruteForceAttempt(ipAddress: string, targetEmail: string, attempts: number): Promise<void> {
    await this.logEvent({
      eventType: 'brute_force_attempt',
      email: targetEmail,
      ipAddress,
      severity: 'critical',
      metadata: {
        attempts,
        targetEmail
      }
    });
  }

  static async logPasswordChange(userId: string, email: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    await this.logEvent({
      eventType: 'password_change',
      userId,
      email,
      severity: 'medium',
      metadata
    });
  }

  static async logSessionExpired(userId: string, email: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    await this.logEvent({
      eventType: 'session_expired',
      userId,
      email,
      severity: 'low',
      metadata
    });
  }

  static async logPermissionDenied(userId: string, email: string, resource: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    await this.logEvent({
      eventType: 'permission_denied',
      userId,
      email,
      severity: 'high',
      metadata: {
        ...metadata,
        resource
      }
    });
  }

  // Method to get security events for a user
  static async getUserSecurityEvents(userId: string, days: number = 30): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch security events: ${error.message}`);
      }

      return data.map(log => ({
        eventType: log.event_type as SecurityEventType,
        userId: log.user_id,
        email: log.event_data?.email,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        metadata: log.event_data?.metadata,
        severity: log.event_data?.severity || 'low',
        timestamp: new Date(log.created_at)
      }));

    } catch (error) {
      console.error('Error getting user security events:', error);
      return [];
    }
  }

  // Method to get system-wide security events
  static async getSystemSecurityEvents(days: number = 7): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        throw new Error(`Failed to fetch system security events: ${error.message}`);
      }

      return data.map(log => ({
        eventType: log.event_type as SecurityEventType,
        userId: log.user_id,
        email: log.event_data?.email,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        metadata: log.event_data?.metadata,
        severity: log.event_data?.severity || 'low',
        timestamp: new Date(log.created_at)
      }));

    } catch (error) {
      console.error('Error getting system security events:', error);
      return [];
    }
  }
}
