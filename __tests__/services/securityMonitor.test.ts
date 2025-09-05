import { AlertingService } from '@/services/alertingService';
import { SecurityEventLogger } from '@/services/securityEventLogger';
import { SecurityMonitor } from '@/services/securityMonitor';
import { supabase } from '@/services/supabase';

// Mock dependencies
jest.mock('@/services/supabase');
jest.mock('@/services/securityEventLogger');
jest.mock('@/services/alertingService');

describe('SecurityMonitor', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockSecurityEventLogger = SecurityEventLogger as jest.Mocked<typeof SecurityEventLogger>;
  const mockAlertingService = AlertingService as jest.Mocked<typeof AlertingService>;

  let securityMonitor: SecurityMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Get singleton instance
    securityMonitor = SecurityMonitor.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = SecurityMonitor.getInstance();
      const instance2 = SecurityMonitor.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Monitoring Lifecycle', () => {
    beforeEach(() => {
      // Mock timers
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start monitoring successfully', () => {
      const startSpy = jest.spyOn(securityMonitor, 'startMonitoring');
      
      securityMonitor.startMonitoring();
      
      expect(startSpy).toHaveBeenCalled();
    });

    it('should stop monitoring successfully', () => {
      const stopSpy = jest.spyOn(securityMonitor, 'stopMonitoring');
      
      securityMonitor.stopMonitoring();
      
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should not start monitoring if already active', () => {
      // Mock isMonitoring to true
      Object.defineProperty(securityMonitor, 'isMonitoring', {
        value: true,
        writable: true,
      });
      
      const startSpy = jest.spyOn(securityMonitor, 'startMonitoring');
      
      securityMonitor.startMonitoring();
      
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('getSecurityMetrics', () => {
    const mockLoginEvents = [
      { event_type: 'login_success', created_at: '2024-01-01T00:00:00.000Z' },
      { event_type: 'login_success', created_at: '2024-01-01T01:00:00.000Z' },
      { event_type: 'login_failed', created_at: '2024-01-01T02:00:00.000Z' },
      { event_type: 'mfa_verification', created_at: '2024-01-01T03:00:00.000Z' },
    ];

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: mockLoginEvents,
              error: null,
            }),
          }),
        }),
      } as any);
    });

    it('should return security metrics successfully', async () => {
      const metrics = await securityMonitor.getSecurityMetrics();
      
      expect(metrics).toEqual({
        totalLogins: 2,
        failedLogins: 1,
        successRate: 50,
        suspiciousActivities: 0,
        mfaUsage: 1,
        lastUpdated: expect.any(String),
      });
    });

    it('should calculate success rate correctly', async () => {
      const allSuccessEvents = [
        { event_type: 'login_success', created_at: '2024-01-01T00:00:00.000Z' },
        { event_type: 'login_success', created_at: '2024-01-01T01:00:00.000Z' },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: allSuccessEvents,
              error: null,
            }),
          }),
        }),
      } as any);

      const metrics = await securityMonitor.getSecurityMetrics();
      
      expect(metrics.successRate).toBe(100);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      await expect(securityMonitor.getSecurityMetrics()).rejects.toThrow();
    });

    it('should calculate suspicious activities correctly', async () => {
      const manyFailedEvents = Array.from({ length: 15 }, (_, i) => ({
        event_type: 'login_failed',
        created_at: `2024-01-01T${i.toString().padStart(2, '0')}:00:00.000Z`,
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: manyFailedEvents,
              error: null,
            }),
          }),
        }),
      } as any);

      const metrics = await securityMonitor.getSecurityMetrics();
      
      expect(metrics.suspiciousActivities).toBe(5); // 15 - 10 = 5
    });
  });

  describe('getSystemMetrics', () => {
    it('should return comprehensive system metrics', async () => {
      const metrics = await securityMonitor.getSystemMetrics();
      
      expect(metrics).toHaveProperty('security');
      expect(metrics).toHaveProperty('health');
      expect(metrics).toHaveProperty('performance');
      
      expect(metrics.security).toHaveProperty('totalLogins');
      expect(metrics.security).toHaveProperty('successRate');
      expect(metrics.health).toHaveProperty('overall');
      expect(metrics.performance).toHaveProperty('averageResponseTime');
    });

    it('should handle errors in individual metric collection', async () => {
      // Mock getSecurityMetrics to throw
      jest.spyOn(securityMonitor, 'getSecurityMetrics').mockRejectedValue(new Error('Security error'));
      
      await expect(securityMonitor.getSystemMetrics()).rejects.toThrow('Security error');
    });
  });

  describe('checkSystemHealth', () => {
    beforeEach(() => {
      // Mock private methods
      jest.spyOn(securityMonitor as any, 'checkDatabaseHealth').mockResolvedValue('healthy');
      jest.spyOn(securityMonitor as any, 'checkAuthenticationHealth').mockResolvedValue('healthy');
      jest.spyOn(securityMonitor as any, 'checkAPIHealth').mockResolvedValue('healthy');
    });

    it('should return healthy status when all components are healthy', async () => {
      const health = await securityMonitor.checkSystemHealth();
      
      expect(health.overall).toBe('healthy');
      expect(health.database).toBe('healthy');
      expect(health.authentication).toBe('healthy');
      expect(health.api).toBe('healthy');
    });

    it('should return degraded status when some components are degraded', async () => {
      jest.spyOn(securityMonitor as any, 'checkDatabaseHealth').mockResolvedValue('degraded');
      
      const health = await securityMonitor.checkSystemHealth();
      
      expect(health.overall).toBe('degraded');
      expect(health.database).toBe('degraded');
    });

    it('should return unhealthy status when critical components are unhealthy', async () => {
      jest.spyOn(securityMonitor as any, 'checkDatabaseHealth').mockResolvedValue('unhealthy');
      jest.spyOn(securityMonitor as any, 'checkAuthenticationHealth').mockResolvedValue('unhealthy');
      
      const health = await securityMonitor.checkSystemHealth();
      
      expect(health.overall).toBe('unhealthy');
    });

    it('should include uptime and last checked information', async () => {
      const health = await securityMonitor.checkSystemHealth();
      
      expect(health.uptime).toBe(99.9);
      expect(health.lastChecked).toBeDefined();
      expect(new Date(health.lastChecked)).toBeInstanceOf(Date);
    });
  });

  describe('getPerformanceMetrics', () => {
    beforeEach(() => {
      // Mock database queries
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as any);
    });

    it('should return performance metrics with all required fields', async () => {
      const metrics = await securityMonitor.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('peakResponseTime');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('latency');
      expect(metrics).toHaveProperty('resourceUsage');
      expect(metrics).toHaveProperty('lastUpdated');
    });

    it('should calculate latency percentiles correctly', async () => {
      const metrics = await securityMonitor.getPerformanceMetrics();
      
      expect(metrics.latency).toHaveProperty('p50');
      expect(metrics.latency).toHaveProperty('p95');
      expect(metrics.latency).toHaveProperty('p99');
      
      // P95 should be >= P50, P99 should be >= P95
      expect(metrics.latency.p95).toBeGreaterThanOrEqual(metrics.latency.p50);
      expect(metrics.latency.p99).toBeGreaterThanOrEqual(metrics.latency.p95);
    });

    it('should include resource usage metrics', async () => {
      const metrics = await securityMonitor.getPerformanceMetrics();
      
      expect(metrics.resourceUsage).toHaveProperty('cpu');
      expect(metrics.resourceUsage).toHaveProperty('memory');
      expect(metrics.resourceUsage).toHaveProperty('database');
      
      // All resource usage should be percentages (0-100)
      expect(metrics.resourceUsage.cpu).toBeGreaterThanOrEqual(0);
      expect(metrics.resourceUsage.cpu).toBeLessThanOrEqual(100);
      expect(metrics.resourceUsage.memory).toBeGreaterThanOrEqual(0);
      expect(metrics.resourceUsage.memory).toBeLessThanOrEqual(100);
      expect(metrics.resourceUsage.database).toBeGreaterThanOrEqual(0);
      expect(metrics.resourceUsage.database).toBeLessThanOrEqual(100);
    });

    it('should store metrics in history', async () => {
      const initialHistoryLength = securityMonitor.getPerformanceHistory().length;
      
      await securityMonitor.getPerformanceMetrics();
      
      const newHistoryLength = securityMonitor.getPerformanceHistory().length;
      expect(newHistoryLength).toBe(initialHistoryLength + 1);
    });

    it('should limit history size', async () => {
      // Add more metrics than the max history size
      for (let i = 0; i < 150; i++) {
        await securityMonitor.getPerformanceMetrics();
      }
      
      const history = securityMonitor.getPerformanceHistory();
      expect(history.length).toBeLessThanOrEqual(100); // MAX_HISTORY_SIZE
    });
  });

  describe('getMonitoringStatus', () => {
    it('should return monitoring status', () => {
      const status = securityMonitor.getMonitoringStatus();
      
      expect(status).toHaveProperty('isMonitoring');
      expect(status).toHaveProperty('checkInterval');
      expect(typeof status.isMonitoring).toBe('boolean');
      expect(typeof status.checkInterval).toBe('number');
    });
  });

  describe('updateCheckInterval', () => {
    it('should update check interval successfully', () => {
      const newInterval = 600000; // 10 minutes
      
      securityMonitor.updateCheckInterval(newInterval);
      
      const status = securityMonitor.getMonitoringStatus();
      expect(status.checkInterval).toBe(newInterval);
    });

    it('should reject intervals less than 1 minute', () => {
      const shortInterval = 30000; // 30 seconds
      
      expect(() => {
        securityMonitor.updateCheckInterval(shortInterval);
      }).toThrow('Check interval must be at least 1 minute');
    });

    it('should restart monitoring if currently active', () => {
      // Mock isMonitoring to true
      Object.defineProperty(securityMonitor, 'isMonitoring', {
        value: true,
        writable: true,
      });
      
      const stopSpy = jest.spyOn(securityMonitor, 'stopMonitoring');
      const startSpy = jest.spyOn(securityMonitor, 'startMonitoring');
      
      securityMonitor.updateCheckInterval(600000);
      
      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('Health Check Methods', () => {
    describe('checkDatabaseHealth', () => {
      it('should return healthy for fast database response', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any);

        const health = await (securityMonitor as any).checkDatabaseHealth();
        expect(health).toBe('healthy');
      });

      it('should return degraded for slow database response', async () => {
        // Mock slow response by adding delay
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockImplementation(() => {
              return new Promise(resolve => {
                setTimeout(() => resolve({ data: [], error: null }), 2500);
              });
            }),
          }),
        } as any);

        const health = await (securityMonitor as any).checkDatabaseHealth();
        expect(health).toBe('degraded');
      });

      it('should return unhealthy for database errors', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        } as any);

        const health = await (securityMonitor as any).checkDatabaseHealth();
        expect(health).toBe('unhealthy');
      });
    });

    describe('checkAuthenticationHealth', () => {
      it('should return healthy for fast auth response', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null,
        });

        const health = await (securityMonitor as any).checkAuthenticationHealth();
        expect(health).toBe('healthy');
      });

      it('should return unhealthy for auth errors', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: { message: 'Authentication service unavailable' },
        });

        const health = await (securityMonitor as any).checkAuthenticationHealth();
        expect(health).toBe('unhealthy');
      });
    });

    describe('checkAPIHealth', () => {
      beforeEach(() => {
        // Mock fetch
        global.fetch = jest.fn();
      });

      it('should return healthy when all endpoints respond', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
        });

        const health = await (securityMonitor as any).checkAPIHealth();
        expect(health).toBe('healthy');
      });

      it('should return degraded when some endpoints fail', async () => {
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({ ok: true, status: 200 })
          .mockRejectedValueOnce(new Error('Network error'));

        const health = await (securityMonitor as any).checkAPIHealth();
        expect(health).toBe('degraded');
      });

      it('should return unhealthy when most endpoints fail', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const health = await (securityMonitor as any).checkAPIHealth();
        expect(health).toBe('unhealthy');
      });
    });
  });

  describe('Overall Health Determination', () => {
    it('should determine overall health correctly', () => {
      const determineHealth = (securityMonitor as any).determineOverallHealth;
      
      expect(determineHealth('healthy', 'healthy', 'healthy')).toBe('healthy');
      expect(determineHealth('healthy', 'degraded', 'healthy')).toBe('degraded');
      expect(determineHealth('unhealthy', 'healthy', 'healthy')).toBe('degraded');
      expect(determineHealth('unhealthy', 'unhealthy', 'healthy')).toBe('unhealthy');
      expect(determineHealth('unhealthy', 'unhealthy', 'unhealthy')).toBe('unhealthy');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in health checks gracefully', async () => {
      // Mock private methods to throw errors
      jest.spyOn(securityMonitor as any, 'checkDatabaseHealth').mockRejectedValue(new Error('DB Error'));
      jest.spyOn(securityMonitor as any, 'checkAuthenticationHealth').mockRejectedValue(new Error('Auth Error'));
      jest.spyOn(securityMonitor as any, 'checkAPIHealth').mockRejectedValue(new Error('API Error'));

      const health = await securityMonitor.checkSystemHealth();
      
      expect(health.overall).toBe('unhealthy');
      expect(mockSecurityEventLogger.logEvent).toHaveBeenCalledWith('health_check_failed', {
        error: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should log security events for critical failures', async () => {
      jest.spyOn(securityMonitor as any, 'checkDatabaseHealth').mockResolvedValue('unhealthy');
      
      await securityMonitor.checkSystemHealth();
      
      expect(mockAlertingService.createAlert).toHaveBeenCalledWith({
        type: 'system_health',
        severity: 'high',
        title: 'System Health Critical',
        description: 'Multiple system components are unhealthy',
        data: expect.any(Object),
      });
    });
  });
});
