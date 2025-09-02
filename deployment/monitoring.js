const { SecurityMonitor } = require('../services/securityMonitor');
const { AlertingService } = require('../services/alertingService');

class ProductionMonitor {
  constructor() {
    this.securityMonitor = SecurityMonitor.getInstance();
    this.alertingService = new AlertingService();
    this.metrics = {
      uptime: Date.now(),
      requests: 0,
      errors: 0,
      responseTime: [],
      lastHealthCheck: null,
    };
    
    this.startMonitoring();
  }
  
  async startMonitoring() {
    console.log('🚀 Starting production monitoring...');
    
    // Start security monitoring
    await this.securityMonitor.startMonitoring();
    
    // Start health checks
    this.startHealthChecks();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start alerting
    this.startAlerting();
    
    console.log('✅ Production monitoring started successfully');
  }
  
  startHealthChecks() {
    setInterval(async () => {
      try {
        const health = await this.checkSystemHealth();
        this.metrics.lastHealthCheck = new Date();
        
        if (health.overall !== 'healthy') {
          await this.alertingService.createAlert({
            type: 'system_health',
            severity: 'high',
            title: 'System Health Degraded',
            description: `System health check failed: ${health.overall}`,
            data: health,
          });
        }
      } catch (error) {
        console.error('Health check failed:', error);
        await this.alertingService.createAlert({
          type: 'monitoring_error',
          severity: 'medium',
          title: 'Health Check Failed',
          description: 'System health check encountered an error',
          data: { error: error.message },
        });
      }
    }, 30000); // Every 30 seconds
  }
  
  startPerformanceMonitoring() {
    setInterval(async () => {
      try {
        const performance = await this.checkPerformanceMetrics();
        
        // Check for performance degradation
        if (performance.averageResponseTime > 1000) { // > 1 second
          await this.alertingService.createAlert({
            type: 'performance_degradation',
            severity: 'medium',
            title: 'Performance Degradation Detected',
            description: `Average response time: ${performance.averageResponseTime}ms`,
            data: performance,
          });
        }
        
        // Check for high error rates
        if (performance.errorRate > 5) { // > 5%
          await this.alertingService.createAlert({
            type: 'high_error_rate',
            severity: 'high',
            title: 'High Error Rate Detected',
            description: `Error rate: ${performance.errorRate}%`,
            data: performance,
          });
        }
      } catch (error) {
        console.error('Performance monitoring failed:', error);
      }
    }, 60000); // Every minute
  }
  
  startAlerting() {
    // Monitor for critical security events
    this.securityMonitor.on('securityEvent', async (event) => {
      if (event.severity === 'critical') {
        await this.alertingService.createAlert({
          type: 'critical_security_event',
          severity: 'critical',
          title: 'Critical Security Event',
          description: event.description || 'Critical security event detected',
          data: event,
        });
      }
    });
    
    // Monitor for system outages
    this.securityMonitor.on('systemOutage', async (outage) => {
      await this.alertingService.createAlert({
        type: 'system_outage',
        severity: 'critical',
        title: 'System Outage Detected',
        description: `System outage detected: ${outage.service}`,
        data: outage,
      });
    });
  }
  
  async checkSystemHealth() {
    try {
      const metrics = await this.securityMonitor.getSystemMetrics();
      return metrics.health;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return { overall: 'unknown', error: error.message };
    }
  }
  
  async checkPerformanceMetrics() {
    try {
      const metrics = await this.securityMonitor.getSystemMetrics();
      return metrics.performance;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return { averageResponseTime: 0, errorRate: 0 };
    }
  }
  
  async getMonitoringStatus() {
    return {
      uptime: Date.now() - this.metrics.uptime,
      lastHealthCheck: this.metrics.lastHealthCheck,
      isMonitoring: true,
      securityMonitoring: await this.securityMonitor.getMonitoringStatus(),
      alertingEnabled: true,
    };
  }
  
  async stopMonitoring() {
    console.log('🛑 Stopping production monitoring...');
    
    await this.securityMonitor.stopMonitoring();
    
    console.log('✅ Production monitoring stopped');
  }
}

// Export singleton instance
module.exports = new ProductionMonitor();
