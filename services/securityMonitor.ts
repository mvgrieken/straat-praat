import { supabase } from './supabase';
import { SecurityEventLogger } from './securityEventLogger';
import { AlertingService } from './alertingService';

export interface SecurityMetrics {
  totalLogins: number;
  failedLogins: number;
  successRate: number;
  suspiciousActivities: number;
  mfaUsage: number;
  lastUpdated: string;
}

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'unhealthy';
  authentication: 'healthy' | 'degraded' | 'unhealthy';
  api: 'healthy' | 'degraded' | 'unhealthy';
  overall: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: string;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private checkInterval = 10 * 60 * 1000; // 10 minutes instead of 5

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Start security monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Security monitoring is already running');
      return;
    }

    try {
      console.log('Security monitoring started with 10-minute intervals');
      this.isMonitoring = true;

      // Initial health check
      await this.performHealthCheck();

      // Set up periodic monitoring
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.performHealthCheck();
        } catch (error) {
          console.error('Error during periodic health check:', error);
          await SecurityEventLogger.logEvent('security_monitor_error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        }
      }, this.checkInterval);

    } catch (error) {
      console.error('Failed to start security monitoring:', error);
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Security monitoring stopped');
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Check database connectivity
      const dbHealth = await this.checkDatabaseHealth();
      
      // Check authentication service
      const authHealth = await this.checkAuthenticationHealth();
      
      // Check API endpoints
      const apiHealth = await this.checkAPIHealth();
      
      // Determine overall health
      const overallHealth = this.determineOverallHealth(dbHealth, authHealth, apiHealth);
      
      const healthStatus: SystemHealth = {
        database: dbHealth,
        authentication: authHealth,
        api: apiHealth,
        overall: overallHealth,
        lastChecked: new Date().toISOString(),
      };

      // Log health status
      await SecurityEventLogger.logEvent('system_health_check', {
        health: healthStatus,
        duration: Date.now() - startTime,
      });

      // Alert if system is unhealthy
      if (overallHealth === 'unhealthy') {
        await AlertingService.createAlert({
          type: 'system_health',
          severity: 'high',
          title: 'System Health Critical',
          description: 'Multiple system components are unhealthy',
          data: healthStatus,
        });
      } else if (overallHealth === 'degraded') {
        await AlertingService.createAlert({
          type: 'system_health',
          severity: 'medium',
          title: 'System Health Degraded',
          description: 'Some system components are experiencing issues',
          data: healthStatus,
        });
      }

      console.log('Health check completed:', healthStatus);

    } catch (error) {
      console.error('Health check failed:', error);
      await SecurityEventLogger.logEvent('health_check_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const startTime = Date.now();
      
      // Test basic database connectivity
      const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        console.error('Database health check failed:', error);
        return 'unhealthy';
      }

      // Consider degraded if response time is too slow
      if (responseTime > 5000) {
        return 'degraded';
      }

      return 'healthy';
    } catch (error) {
      console.error('Database health check error:', error);
      return 'unhealthy';
    }
  }

  /**
   * Check authentication service health
   */
  private async checkAuthenticationHealth(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      // Test authentication service by checking if we can access auth tables
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Authentication health check failed:', error);
        return 'unhealthy';
      }

      return 'healthy';
    } catch (error) {
      console.error('Authentication health check error:', error);
      return 'unhealthy';
    }
  }

  /**
   * Check API health
   */
  private async checkAPIHealth(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      // Test API endpoints by making a simple request
      const { data, error } = await supabase
        .from('words')
        .select('count')
        .limit(1);

      if (error) {
        console.error('API health check failed:', error);
        return 'unhealthy';
      }

      return 'healthy';
      } catch (error) {
      console.error('API health check error:', error);
      return 'unhealthy';
    }
  }

  /**
   * Determine overall system health
   */
  private determineOverallHealth(
    dbHealth: 'healthy' | 'degraded' | 'unhealthy',
    authHealth: 'healthy' | 'degraded' | 'unhealthy',
    apiHealth: 'healthy' | 'degraded' | 'unhealthy'
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const healthScores = {
      healthy: 3,
      degraded: 2,
      unhealthy: 1,
    };

    const totalScore = healthScores[dbHealth] + healthScores[authHealth] + healthScores[apiHealth];
    const maxScore = 9;

    if (totalScore === maxScore) {
      return 'healthy';
    } else if (totalScore >= 6) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  /**
   * Get current security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get login statistics from audit log
      const { data: loginEvents, error } = await supabase
        .from('auth_audit_log')
        .select('event_type, created_at')
        .gte('created_at', oneDayAgo.toISOString())
        .in('event_type', ['login_success', 'login_failed', 'mfa_verification']);

      if (error) {
        console.error('Error fetching security metrics:', error);
        throw error;
      }

      const totalLogins = loginEvents?.filter(e => e.event_type === 'login_success').length || 0;
      const failedLogins = loginEvents?.filter(e => e.event_type === 'login_failed').length || 0;
      const mfaUsage = loginEvents?.filter(e => e.event_type === 'mfa_verification').length || 0;
      
      const successRate = totalLogins > 0 ? ((totalLogins - failedLogins) / totalLogins) * 100 : 100;
      
      // Calculate suspicious activities (simplified - could be more sophisticated)
      const suspiciousActivities = failedLogins > 10 ? failedLogins - 10 : 0;

      return {
        totalLogins,
        failedLogins,
        successRate: Math.round(successRate * 100) / 100,
        suspiciousActivities,
        mfaUsage,
        lastUpdated: now.toISOString(),
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw error;
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): { isMonitoring: boolean; checkInterval: number } {
    return {
      isMonitoring: this.isMonitoring,
      checkInterval: this.checkInterval,
    };
  }

  /**
   * Update check interval
   */
  updateCheckInterval(intervalMs: number): void {
    if (intervalMs < 60000) { // Minimum 1 minute
      throw new Error('Check interval must be at least 1 minute');
    }

    this.checkInterval = intervalMs;
    
    if (this.isMonitoring) {
      // Restart monitoring with new interval
      this.stopMonitoring();
      this.startMonitoring();
    }
  }
}
