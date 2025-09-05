import { SecurityEvent, ThreatLevel, SecurityAlert } from '@/types';

import { AlertingService } from './alertingService';
import { SecurityEventLogger } from './securityEventLogger';
import { supabase } from './supabase';


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
  uptime: number;
  lastOutage: Date | null;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  peakResponseTime: number;
  errorRate: number;
  throughput: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  resourceUsage: {
    cpu: number;
    memory: number;
    database: number;
  };
  lastUpdated: string;
}

export interface SystemMetrics {
  security: SecurityMetrics;
  health: SystemHealth;
  performance: PerformanceMetrics;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private isMonitoring: boolean = false;
  private checkInterval: number = 5 * 60 * 1000; // 5 minutes
  private monitoringInterval?: NodeJS.Timeout;
  private performanceHistory: PerformanceMetrics[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);

    console.log('Security monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
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
        uptime: 99.9, // This would be calculated from actual uptime data
        lastOutage: null // This would be tracked from actual outage data
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
      
      // Test database connectivity with a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        console.error('Database health check failed:', error);
        return 'unhealthy';
      }

      // Consider response time for health assessment
      if (responseTime > 5000) {
        return 'unhealthy';
      } else if (responseTime > 2000) {
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
      const startTime = Date.now();
      
      // Test authentication service with a simple operation
      const { data: { session }, error } = await supabase.auth.getSession();

      const responseTime = Date.now() - startTime;

      if (error) {
        console.error('Authentication health check failed:', error);
        return 'unhealthy';
      }

      // Consider response time for health assessment
      if (responseTime > 3000) {
        return 'unhealthy';
      } else if (responseTime > 1000) {
        return 'degraded';
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
      const startTime = Date.now();
      
      // Test API endpoints (simplified - would test actual endpoints)
      const testEndpoints = [
        '/api/health',
        '/api/status'
      ];

      let healthyEndpoints = 0;
      let totalResponseTime = 0;

      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(endpoint, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            healthyEndpoints++;
          }
          
          totalResponseTime += Date.now() - startTime;
        } catch (error) {
          console.error(`API endpoint ${endpoint} health check failed:`, error);
        }
      }

      const averageResponseTime = totalResponseTime / testEndpoints.length;
      const healthPercentage = (healthyEndpoints / testEndpoints.length) * 100;

      if (healthPercentage < 50) {
        return 'unhealthy';
      } else if (healthPercentage < 100 || averageResponseTime > 2000) {
        return 'degraded';
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
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [security, health, performance] = await Promise.all([
        this.getSecurityMetrics(),
        this.checkSystemHealth(),
        this.getPerformanceMetrics()
      ]);

      return {
        security,
        health,
        performance
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Check system health
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    try {
      const dbHealth = await this.checkDatabaseHealth();
      const authHealth = await this.checkAuthenticationHealth();
      const apiHealth = await this.checkAPIHealth();
      const overallHealth = this.determineOverallHealth(dbHealth, authHealth, apiHealth);

      return {
        database: dbHealth,
        authentication: authHealth,
        api: apiHealth,
        overall: overallHealth,
        lastChecked: new Date().toISOString(),
        uptime: 99.9, // This would be calculated from actual uptime data
        lastOutage: null // This would be tracked from actual outage data
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const startTime = Date.now();
      
      // Simulate performance measurements
      const responseTimes: number[] = [];
      
      // Measure database query performance
      const dbStart = Date.now();
      await supabase.from('profiles').select('id').limit(1);
      responseTimes.push(Date.now() - dbStart);
      
      // Measure authentication performance
      const authStart = Date.now();
      await supabase.auth.getSession();
      responseTimes.push(Date.now() - authStart);
      
      // Calculate metrics
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const peakResponseTime = Math.max(...responseTimes);
      const errorRate = 0.1; // This would be calculated from actual error data
      const throughput = 1000; // This would be calculated from actual throughput data
      
      // Calculate percentiles
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
      
      const metrics: PerformanceMetrics = {
        averageResponseTime,
        peakResponseTime,
        errorRate,
        throughput,
        latency: {
          p50,
          p95,
          p99
        },
        resourceUsage: {
          cpu: 15, // This would be actual CPU usage
          memory: 45, // This would be actual memory usage
          database: 25 // This would be actual database usage
        },
        lastUpdated: new Date().toISOString()
      };

      // Store in history
      this.performanceHistory.push(metrics);
      if (this.performanceHistory.length > this.MAX_HISTORY_SIZE) {
        this.performanceHistory.shift();
      }

      return metrics;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
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
