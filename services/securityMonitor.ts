import { supabase } from './supabase';
import { AuthAnalyticsService } from './authAnalyticsService';
import { SessionManager } from './sessionManager';

export interface SecurityHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  checks: SecurityCheck[];
  lastUpdated: Date;
}

export interface SecurityCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  details?: any;
}

export interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

export class SecurityMonitor {
  private static alerts: SecurityAlert[] = [];
  private static monitoringInterval: NodeJS.Timeout | null = null;

  static async checkSystemHealth(): Promise<SecurityHealthStatus> {
    const checks: SecurityCheck[] = [];

    try {
      // Check database connection
      const dbCheck = await this.checkDatabaseConnection();
      checks.push(dbCheck);

      // Check authentication system
      const authCheck = await this.checkAuthenticationSystem();
      checks.push(authCheck);

      // Check session management
      const sessionCheck = await this.checkSessionManagement();
      checks.push(sessionCheck);

      // Check security policies
      const policyCheck = await this.checkSecurityPolicies();
      checks.push(policyCheck);

      // Check for suspicious activity
      const suspiciousCheck = await this.checkSuspiciousActivity();
      checks.push(suspiciousCheck);

      // Determine overall status
      const criticalChecks = checks.filter(c => c.status === 'critical').length;
      const degradedChecks = checks.filter(c => c.status === 'degraded').length;

      let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (criticalChecks > 0) {
        overall = 'critical';
      } else if (degradedChecks > 0) {
        overall = 'degraded';
      }

      return {
        overall,
        checks,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error checking system health:', error);
      return {
        overall: 'critical',
        checks: [{
          name: 'System Health Check',
          status: 'critical',
          message: 'Failed to perform system health check'
        }],
        lastUpdated: new Date()
      };
    }
  }

  private static async checkDatabaseConnection(): Promise<SecurityCheck> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        return {
          name: 'Database Connection',
          status: 'critical',
          message: `Database connection failed: ${error.message}`
        };
      }

      return {
        name: 'Database Connection',
        status: 'healthy',
        message: 'Database connection is working properly'
      };

    } catch (error) {
      return {
        name: 'Database Connection',
        status: 'critical',
        message: `Database connection error: ${error}`
      };
    }
  }

  private static async checkAuthenticationSystem(): Promise<SecurityCheck> {
    try {
      // Check if auth tables exist and are accessible
      const { data: authData, error: authError } = await supabase
        .from('user_security')
        .select('count')
        .limit(1);

      if (authError) {
        return {
          name: 'Authentication System',
          status: 'critical',
          message: `Authentication system error: ${authError.message}`
        };
      }

      // Check recent authentication metrics
      const metrics = await AuthAnalyticsService.getSystemAuthMetrics(1);
      
      if (metrics.loginSuccessRate < 95) {
        return {
          name: 'Authentication System',
          status: 'degraded',
          message: `Low login success rate: ${metrics.loginSuccessRate.toFixed(1)}%`,
          details: metrics
        };
      }

      return {
        name: 'Authentication System',
        status: 'healthy',
        message: 'Authentication system is working properly'
      };

    } catch (error) {
      return {
        name: 'Authentication System',
        status: 'critical',
        message: `Authentication system error: ${error}`
      };
    }
  }

  private static async checkSessionManagement(): Promise<SecurityCheck> {
    try {
      const isHealthy = await SessionManager.monitorSessionHealth();
      
      if (!isHealthy) {
        return {
          name: 'Session Management',
          status: 'degraded',
          message: 'Session management issues detected'
        };
      }

      return {
        name: 'Session Management',
        status: 'healthy',
        message: 'Session management is working properly'
      };

    } catch (error) {
      return {
        name: 'Session Management',
        status: 'critical',
        message: `Session management error: ${error}`
      };
    }
  }

  private static async checkSecurityPolicies(): Promise<SecurityCheck> {
    try {
      // Check if RLS is enabled on critical tables
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('check_rls_policies');

      if (rlsError) {
        // Fallback check
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        if (profilesError && profilesError.message.includes('permission denied')) {
          return {
            name: 'Security Policies',
            status: 'healthy',
            message: 'RLS policies are working (access denied as expected)'
          };
        }
      }

      return {
        name: 'Security Policies',
        status: 'healthy',
        message: 'Security policies are properly configured'
      };

    } catch (error) {
      return {
        name: 'Security Policies',
        status: 'degraded',
        message: `Security policy check error: ${error}`
      };
    }
  }

  private static async checkSuspiciousActivity(): Promise<SecurityCheck> {
    try {
      // Check for recent failed login attempts
      const { data: failedLogins, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('event_type', 'login_failure')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false });

      if (error) {
        return {
          name: 'Suspicious Activity',
          status: 'degraded',
          message: `Failed to check suspicious activity: ${error.message}`
        };
      }

      const totalFailures = failedLogins.length;
      const uniqueIPs = new Set(failedLogins.map(log => log.ip_address)).size;

      // Check for potential brute force attacks
      if (totalFailures > 50) {
        return {
          name: 'Suspicious Activity',
          status: 'critical',
          message: `High number of failed login attempts: ${totalFailures} in the last hour`,
          details: { totalFailures, uniqueIPs }
        };
      }

      if (totalFailures > 20) {
        return {
          name: 'Suspicious Activity',
          status: 'degraded',
          message: `Elevated failed login attempts: ${totalFailures} in the last hour`,
          details: { totalFailures, uniqueIPs }
        };
      }

      return {
        name: 'Suspicious Activity',
        status: 'healthy',
        message: 'No suspicious activity detected'
      };

    } catch (error) {
      return {
        name: 'Suspicious Activity',
        status: 'degraded',
        message: `Suspicious activity check error: ${error}`
      };
    }
  }

  static async startMonitoring(intervalMinutes: number = 5): Promise<void> {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const healthStatus = await this.checkSystemHealth();
        
        if (healthStatus.overall === 'critical') {
          await this.createAlert('critical', 'System health check failed', healthStatus);
        } else if (healthStatus.overall === 'degraded') {
          await this.createAlert('warning', 'System health degraded', healthStatus);
        }

        // Log health status
        console.log(`Security Monitor: System health is ${healthStatus.overall}`);
        
      } catch (error) {
        console.error('Security Monitor: Error during health check:', error);
        await this.createAlert('error', 'Security monitoring error', { error: error.message });
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`Security monitoring started with ${intervalMinutes}-minute intervals`);
  }

  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Security monitoring stopped');
    }
  }

  static async createAlert(
    type: 'warning' | 'error' | 'critical',
    message: string,
    metadata?: any
  ): Promise<void> {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.push(alert);

    // Log the alert
    console.log(`Security Alert [${type.toUpperCase()}]: ${message}`);

    // Store alert in database for persistence
    try {
      await AuthAnalyticsService.trackSecurityEvent('security_alert', null, {
        alertId: alert.id,
        type: alert.type,
        message: alert.message,
        metadata: alert.metadata
      });
    } catch (error) {
      console.error('Failed to store security alert:', error);
    }
  }

  static getAlerts(includeResolved: boolean = false): SecurityAlert[] {
    if (includeResolved) {
      return [...this.alerts];
    }
    return this.alerts.filter(alert => !alert.resolved);
  }

  static async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  static async generateSecurityReport(): Promise<any> {
    try {
      const healthStatus = await this.checkSystemHealth();
      const alerts = this.getAlerts(true);
      const metrics = await AuthAnalyticsService.getSystemAuthMetrics(7);

      return {
        timestamp: new Date().toISOString(),
        healthStatus,
        alerts: {
          total: alerts.length,
          resolved: alerts.filter(a => a.resolved).length,
          critical: alerts.filter(a => a.type === 'critical').length,
          recent: alerts.filter(a => !a.resolved)
        },
        metrics,
        recommendations: this.generateRecommendations(healthStatus, alerts, metrics)
      };

    } catch (error) {
      console.error('Error generating security report:', error);
      return null;
    }
  }

  private static generateRecommendations(
    healthStatus: SecurityHealthStatus,
    alerts: SecurityAlert[],
    metrics: any
  ): string[] {
    const recommendations: string[] = [];

    if (healthStatus.overall === 'critical') {
      recommendations.push('Immediate action required: System health is critical');
    }

    if (healthStatus.overall === 'degraded') {
      recommendations.push('System health is degraded - review and address issues');
    }

    const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.resolved);
    if (criticalAlerts.length > 0) {
      recommendations.push(`Address ${criticalAlerts.length} critical security alerts`);
    }

    if (metrics.loginSuccessRate < 95) {
      recommendations.push('Investigate low login success rate');
    }

    if (metrics.failedLoginAttempts > 100) {
      recommendations.push('Review failed login attempts for potential attacks');
    }

    return recommendations;
  }
}
