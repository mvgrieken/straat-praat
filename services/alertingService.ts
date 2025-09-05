import { AlertRule, Alert, AlertSeverity, AlertChannel } from '@/types';

import { EmailService } from './emailService';
import { NotificationService } from './notificationService';
import { SecurityEventLogger } from './securityEventLogger';
import { SlackService } from './slackService';
import { supabase } from './supabase';


export interface AlertRule {
  id: string;
  name: string;
  description: string;
  eventType: string;
  condition: 'threshold' | 'pattern' | 'anomaly';
  threshold?: number;
  timeWindow: number; // in minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  actions: AlertAction[];
  createdAt: string;
  updatedAt: string;
}

export interface AlertAction {
  type: 'email' | 'push' | 'webhook' | 'sms' | 'slack';
  config: AlertConfig;
  enabled: boolean;
}

export interface AlertConfig {
  recipients?: string[];
  channel?: string;
  webhook_url?: string;
  phone_number?: string;
  [key: string]: string | string[] | undefined;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, string | number | boolean>;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  type: 'email' | 'push' | 'webhook' | 'sms' | 'slack';
  status: 'pending' | 'sent' | 'failed';
  recipient?: string;
  message: string;
  sentAt?: string;
  errorMessage?: string;
}

interface SecurityEvent {
  eventType: string;
  userId?: string;
  email?: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
  ipAddress?: string;
  userAgent?: string;
}

interface AlertDetails {
  eventType: string;
  userId?: string;
  email?: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

interface AlertStats {
  total: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byStatus: {
    active: number;
    acknowledged: number;
    resolved: number;
  };
  byRule: Record<string, number>;
}

export class AlertingService {
  private static readonly DEFAULT_RULES: AlertRule[] = [
    {
      id: 'failed-login-threshold',
      name: 'Failed Login Threshold',
      description: 'Alert when too many failed login attempts detected',
      eventType: 'login_failure',
      condition: 'threshold',
      threshold: 5,
      timeWindow: 15,
      severity: 'high',
      enabled: true,
      actions: [
        {
          type: 'email',
          config: { recipients: ['admin@straat-praat.nl'] },
          enabled: true,
        },
        {
          type: 'push',
          config: { channel: 'security-alerts' },
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'suspicious-activity',
      name: 'Suspicious Activity Detection',
      description: 'Alert when suspicious login patterns are detected',
      eventType: 'suspicious_activity',
      condition: 'pattern',
      timeWindow: 60,
      severity: 'medium',
      enabled: true,
      actions: [
        {
          type: 'email',
          config: { recipients: ['security@straat-praat.nl'] },
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mfa-bypass-attempts',
      name: 'MFA Bypass Attempts',
      description: 'Alert when multiple MFA bypass attempts are detected',
      eventType: 'mfa_failure',
      condition: 'threshold',
      threshold: 3,
      timeWindow: 30,
      severity: 'critical',
      enabled: true,
      actions: [
        {
          type: 'email',
          config: { recipients: ['admin@straat-praat.nl', 'security@straat-praat.nl'] },
          enabled: true,
        },
        {
          type: 'slack',
          config: { channel: '#security-incidents' },
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'account-lockout',
      name: 'Account Lockout',
      description: 'Alert when user accounts are locked due to security violations',
      eventType: 'account_locked',
      condition: 'threshold',
      threshold: 1,
      timeWindow: 5,
      severity: 'medium',
      enabled: true,
      actions: [
        {
          type: 'email',
          config: { recipients: ['admin@straat-praat.nl'] },
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  /**
   * Initialize alerting system with default rules
   */
  static async initialize(): Promise<void> {
    try {
      // Check if rules table exists and has data
      const { data: existingRules, error } = await supabase
        .from('alert_rules')
        .select('id')
        .limit(1);

      if (error || !existingRules || existingRules.length === 0) {
        // Insert default rules
        for (const rule of this.DEFAULT_RULES) {
          await this.createAlertRule(rule);
        }
      }
    } catch (error) {
      console.error('Error initializing alerting system:', error);
    }
  }

  /**
   * Create a new alert rule
   */
  static async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    try {
      const newRule: AlertRule = {
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('alert_rules')
        .insert(newRule);

      if (error) {
        throw new Error(`Failed to create alert rule: ${error.message}`);
      }

      return newRule;
    } catch (error) {
      console.error('Error creating alert rule:', error);
      throw error;
    }
  }

  /**
   * Get all alert rules
   */
  static async getAlertRules(): Promise<AlertRule[]> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch alert rules: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching alert rules:', error);
      return [];
    }
  }

  /**
   * Update an alert rule
   */
  static async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update alert rule: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating alert rule:', error);
      throw error;
    }
  }

  /**
   * Delete an alert rule
   */
  static async deleteAlertRule(ruleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        throw new Error(`Failed to delete alert rule: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      return false;
    }
  }

  /**
   * Process security events and trigger alerts
   */
  static async processSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const rules = await this.getAlertRules();
      const enabledRules = rules.filter(rule => rule.enabled);

      for (const rule of enabledRules) {
        if (rule.eventType === event.eventType) {
          const shouldTrigger = await this.evaluateRule(rule, event);
          
          if (shouldTrigger) {
            await this.createAlert(rule, event);
          }
        }
      }
    } catch (error) {
      console.error('Error processing security event:', error);
    }
  }

  /**
   * Evaluate if a rule should trigger an alert
   */
  private static async evaluateRule(rule: AlertRule, event: SecurityEvent): Promise<boolean> {
    try {
      switch (rule.condition) {
        case 'threshold':
          return await this.evaluateThreshold(rule, event);
        case 'pattern':
          return await this.evaluatePattern(rule, event);
        case 'anomaly':
          return await this.evaluateAnomaly(rule, event);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating rule:', error);
      return false;
    }
  }

  /**
   * Evaluate threshold-based rules
   */
  private static async evaluateThreshold(rule: AlertRule, event: SecurityEvent): Promise<boolean> {
    if (!rule.threshold) return false;

    const { data: events, error } = await supabase
      .from('auth_audit_log')
      .select('*')
      .eq('event_type', rule.eventType)
      .gte('timestamp', new Date(Date.now() - rule.timeWindow * 60 * 1000).toISOString());

    if (error || !events) return false;

    return events.length >= rule.threshold;
  }

  /**
   * Evaluate pattern-based rules
   */
  private static async evaluatePattern(rule: AlertRule, event: SecurityEvent): Promise<boolean> {
    // Implement pattern matching logic
    // For now, return true for suspicious activity events
    return event.eventType === 'suspicious_activity';
  }

  /**
   * Evaluate anomaly-based rules
   */
  private static async evaluateAnomaly(rule: AlertRule, event: SecurityEvent): Promise<boolean> {
    // Implement anomaly detection logic
    // For now, return false
    return false;
  }

  /**
   * Create an alert
   */
  private static async createAlert(rule: AlertRule, event: SecurityEvent): Promise<Alert> {
    try {
      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message: this.generateAlertMessage(rule, event),
        details: {
          eventType: event.eventType,
          userId: event.userId,
          email: event.email,
          timestamp: event.timestamp,
          metadata: event.metadata,
        },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('alerts')
        .insert(alert);

      if (error) {
        throw new Error(`Failed to create alert: ${error.message}`);
      }

      // Send notifications
      await this.sendNotifications(alert, rule);

      // Log the alert creation
      await SecurityEventLogger.logEvent({
        eventType: 'alert_created',
        userId: event.userId,
        email: event.email,
        severity: rule.severity,
        metadata: {
          alertId: alert.id,
          ruleId: rule.id,
          ruleName: rule.name,
        },
      });

      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Generate alert message
   */
  private static generateAlertMessage(rule: AlertRule, event: SecurityEvent): string {
    const baseMessage = rule.description;
    
    switch (rule.eventType) {
      case 'login_failure':
        return `${baseMessage}: Multiple failed login attempts detected for ${event.email}`;
      case 'suspicious_activity':
        return `${baseMessage}: Suspicious login pattern detected for ${event.email}`;
      case 'mfa_failure':
        return `${baseMessage}: Multiple MFA failures detected for ${event.email}`;
      case 'account_locked':
        return `${baseMessage}: Account locked for ${event.email} due to security violations`;
      default:
        return `${baseMessage}: Security event detected for ${event.email}`;
    }
  }

  /**
   * Send notifications for an alert
   */
  private static async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    try {
      for (const action of rule.actions) {
        if (action.enabled) {
          await this.sendNotification(alert, action);
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Send a single notification
   */
  private static async sendNotification(alert: Alert, action: AlertAction): Promise<void> {
    try {
      const notification: AlertNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertId: alert.id,
        type: action.type,
        status: 'pending',
        message: alert.message,
      };

      // Store notification
      const { error } = await supabase
        .from('alert_notifications')
        .insert(notification);

      if (error) {
        throw new Error(`Failed to store notification: ${error.message}`);
      }

      // Send notification based on type
      switch (action.type) {
        case 'email':
          await this.sendEmailNotification(notification, action.config);
          break;
        case 'push':
          await this.sendPushNotification(notification, action.config);
          break;
        case 'webhook':
          await this.sendWebhookNotification(notification, action.config);
          break;
        case 'slack':
          await this.sendSlackNotification(notification, action.config);
          break;
        default:
          console.warn(`Unknown notification type: ${action.type}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(notification: AlertNotification, config: AlertConfig): Promise<void> {
    // Implement email sending logic
    console.log('Sending email notification:', notification.message, 'to:', config.recipients);
    
    // Update notification status
    await this.updateNotificationStatus(notification.id, 'sent');
  }

  /**
   * Send push notification
   */
  private static async sendPushNotification(notification: AlertNotification, config: AlertConfig): Promise<void> {
    // Implement push notification logic
    console.log('Sending push notification:', notification.message, 'to channel:', config.channel);
    
    // Update notification status
    await this.updateNotificationStatus(notification.id, 'sent');
  }

  /**
   * Send webhook notification
   */
  private static async sendWebhookNotification(notification: AlertNotification, config: AlertConfig): Promise<void> {
    // Implement webhook notification logic
    console.log('Sending webhook notification:', notification.message);
    
    // Update notification status
    await this.updateNotificationStatus(notification.id, 'sent');
  }

  /**
   * Send Slack notification
   */
  private static async sendSlackNotification(notification: AlertNotification, config: AlertConfig): Promise<void> {
    // Implement Slack notification logic
    console.log('Sending Slack notification:', notification.message, 'to channel:', config.channel);
    
    // Update notification status
    await this.updateNotificationStatus(notification.id, 'sent');
  }

  /**
   * Update notification status
   */
  private static async updateNotificationStatus(notificationId: string, status: 'sent' | 'failed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('alert_notifications')
        .update({
          status,
          sentAt: status === 'sent' ? new Date().toISOString() : undefined,
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error updating notification status:', error);
      }
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }

  /**
   * Get all alerts
   */
  static async getAlerts(status?: string): Promise<Alert[]> {
    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('createdAt', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch alerts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'acknowledged',
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy,
        })
        .eq('id', alertId);

      if (error) {
        throw new Error(`Failed to acknowledge alert: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) {
        throw new Error(`Failed to resolve alert: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(days: number = 7): Promise<AlertStats> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .gte('createdAt', startDate);

      if (error) {
        throw new Error(`Failed to fetch alert stats: ${error.message}`);
      }

      const stats: AlertStats = {
        total: alerts?.length || 0,
        bySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        byStatus: {
          active: 0,
          acknowledged: 0,
          resolved: 0,
        },
        byRule: {},
      };

      alerts?.forEach(alert => {
        stats.bySeverity[alert.severity]++;
        stats.byStatus[alert.status]++;
        
        if (!stats.byRule[alert.ruleName]) {
          stats.byRule[alert.ruleName] = 0;
        }
        stats.byRule[alert.ruleName]++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      return {
        total: 0,
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        byStatus: { active: 0, acknowledged: 0, resolved: 0 },
        byRule: {},
      };
    }
  }
}
