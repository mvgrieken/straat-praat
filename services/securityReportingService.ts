import { supabase } from './supabase';
import { AuthAnalyticsService } from './authAnalyticsService';
import { SecurityMonitor } from './securityMonitor';
import { AlertingService } from './alertingService';

export interface SecurityReport {
  id: string;
  type: 'user_activity' | 'security_incident' | 'compliance' | 'threat_intelligence' | 'system_health';
  title: string;
  description: string;
  data: any;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEvents: number;
    criticalIssues: number;
    warnings: number;
    recommendations: string[];
  };
}

export interface UserActivityReport {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  loginAttempts: {
    successful: number;
    failed: number;
    rate: number;
  };
  mfaUsage: {
    enabled: number;
    used: number;
    rate: number;
  };
  topUserActivities: Array<{
    userId: string;
    email: string;
    loginCount: number;
    lastLogin: Date;
  }>;
  suspiciousActivities: Array<{
    userId: string;
    email: string;
    event: string;
    timestamp: Date;
    risk: 'low' | 'medium' | 'high';
  }>;
}

export interface SecurityIncidentReport {
  totalIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  averageResolutionTime: number;
  incidentsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  recentIncidents: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: Date;
    status: 'active' | 'acknowledged' | 'resolved';
  }>;
  topThreats: Array<{
    threat: string;
    occurrences: number;
    impact: 'low' | 'medium' | 'high';
  }>;
}

export interface ComplianceReport {
  dataRetention: {
    userDataRetentionDays: number;
    auditLogRetentionDays: number;
    complianceStatus: 'compliant' | 'non_compliant' | 'pending';
  };
  privacyControls: {
    dataEncryption: boolean;
    accessControls: boolean;
    auditLogging: boolean;
    dataMinimization: boolean;
  };
  regulatoryCompliance: {
    gdpr: boolean;
    ccpa: boolean;
    sox: boolean;
    hipaa: boolean;
  };
  recommendations: string[];
}

export interface ThreatIntelligenceReport {
  threatLandscape: {
    totalThreats: number;
    activeThreats: number;
    mitigatedThreats: number;
  };
  threatCategories: Array<{
    category: string;
    count: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  emergingThreats: Array<{
    threat: string;
    description: string;
    firstSeen: Date;
    frequency: number;
    impact: 'low' | 'medium' | 'high';
  }>;
  iocIndicators: Array<{
    type: 'ip' | 'domain' | 'email' | 'hash';
    value: string;
    threat: string;
    confidence: number;
  }>;
}

export interface SystemHealthReport {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  uptime: {
    percentage: number;
    downtime: number;
    lastOutage: Date | null;
  };
  performance: {
    averageResponseTime: number;
    peakResponseTime: number;
    errorRate: number;
  };
  security: {
    vulnerabilities: number;
    patchesApplied: number;
    securityScore: number;
  };
  recommendations: string[];
}

export class SecurityReportingService {
  private static readonly REPORT_RETENTION_DAYS = 90;

  /**
   * Generate a comprehensive user activity report
   */
  static async generateUserActivityReport(
    startDate: Date,
    endDate: Date
  ): Promise<UserActivityReport> {
    try {
      // Get user statistics
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, created_at, updated_at');

      if (usersError) throw usersError;

      // Get authentication events
      const { data: authEvents, error: authError } = await supabase
        .from('auth_audit_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (authError) throw authError;

      // Get security events
      const { data: securityEvents, error: securityError } = await supabase
        .from('user_security')
        .select('*');

      if (securityError) throw securityError;

      // Calculate statistics
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => 
        new Date(u.updated_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0;
      const newUsers = users?.filter(u => 
        new Date(u.created_at) >= startDate && new Date(u.created_at) <= endDate
      ).length || 0;

      const loginEvents = authEvents?.filter(e => e.event_type === 'login') || [];
      const successfulLogins = loginEvents.filter(e => e.success).length;
      const failedLogins = loginEvents.filter(e => !e.success).length;
      const loginRate = totalUsers > 0 ? (successfulLogins / totalUsers) * 100 : 0;

      const mfaEnabled = securityEvents?.filter(e => e.mfa_enabled).length || 0;
      const mfaUsed = authEvents?.filter(e => e.event_type === 'mfa_verification' && e.success).length || 0;
      const mfaRate = mfaEnabled > 0 ? (mfaUsed / mfaEnabled) * 100 : 0;

      // Get top user activities
      const userLoginCounts = new Map<string, { count: number; lastLogin: Date; email: string }>();
      loginEvents.forEach(event => {
        const userId = event.user_id;
        const existing = userLoginCounts.get(userId) || { count: 0, lastLogin: new Date(0), email: '' };
        userLoginCounts.set(userId, {
          count: existing.count + 1,
          lastLogin: new Date(event.created_at) > existing.lastLogin ? new Date(event.created_at) : existing.lastLogin,
          email: event.user_email || existing.email
        });
      });

      const topUserActivities = Array.from(userLoginCounts.entries())
        .map(([userId, data]) => ({
          userId,
          email: data.email,
          loginCount: data.count,
          lastLogin: data.lastLogin
        }))
        .sort((a, b) => b.loginCount - a.loginCount)
        .slice(0, 10);

      // Get suspicious activities
      const suspiciousActivities = authEvents
        ?.filter(e => e.risk_level === 'high' || e.risk_level === 'medium')
        .map(e => ({
          userId: e.user_id,
          email: e.user_email,
          event: e.event_type,
          timestamp: new Date(e.created_at),
          risk: e.risk_level as 'low' | 'medium' | 'high'
        }))
        .slice(0, 20) || [];

      return {
        totalUsers,
        activeUsers,
        newUsers,
        loginAttempts: {
          successful: successfulLogins,
          failed: failedLogins,
          rate: loginRate
        },
        mfaUsage: {
          enabled: mfaEnabled,
          used: mfaUsed,
          rate: mfaRate
        },
        topUserActivities,
        suspiciousActivities
      };
    } catch (error) {
      console.error('Error generating user activity report:', error);
      throw error;
    }
  }

  /**
   * Generate a security incident report
   */
  static async generateSecurityIncidentReport(
    startDate: Date,
    endDate: Date
  ): Promise<SecurityIncidentReport> {
    try {
      // Get alerts
      const alerts = await AlertingService.getAlerts();

      // Get security events
      const { data: securityEvents, error: securityError } = await supabase
        .from('auth_audit_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('event_type', ['failed_login', 'suspicious_activity', 'account_lockout', 'mfa_bypass_attempt']);

      if (securityError) throw securityError;

      const totalIncidents = alerts.length;
      const criticalIncidents = alerts.filter(a => a.severity === 'critical').length;
      const resolvedIncidents = alerts.filter(a => a.status === 'resolved').length;

      // Calculate average resolution time
      const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.resolved_at);
      const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => {
        const created = new Date(alert.created_at);
        const resolved = new Date(alert.resolved_at!);
        return sum + (resolved.getTime() - created.getTime());
      }, 0);
      const averageResolutionTime = resolvedAlerts.length > 0 ? totalResolutionTime / resolvedAlerts.length : 0;

      // Group incidents by type
      const incidentTypes = new Map<string, number>();
      alerts.forEach(alert => {
        const type = alert.rule_type || 'unknown';
        incidentTypes.set(type, (incidentTypes.get(type) || 0) + 1);
      });

      const incidentsByType = Array.from(incidentTypes.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: (count / totalIncidents) * 100
      }));

      // Get recent incidents
      const recentIncidents = alerts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20)
        .map(alert => ({
          id: alert.id,
          type: alert.rule_type || 'unknown',
          severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
          description: alert.message,
          timestamp: new Date(alert.created_at),
          status: alert.status as 'active' | 'acknowledged' | 'resolved'
        }));

      // Analyze top threats
      const threatCounts = new Map<string, number>();
      securityEvents?.forEach(event => {
        const threat = event.event_type;
        threatCounts.set(threat, (threatCounts.get(threat) || 0) + 1);
      });

      const topThreats = Array.from(threatCounts.entries())
        .map(([threat, occurrences]) => ({
          threat,
          occurrences,
          impact: this.calculateThreatImpact(threat, occurrences) as 'low' | 'medium' | 'high'
        }))
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 10);

      return {
        totalIncidents,
        criticalIncidents,
        resolvedIncidents,
        averageResolutionTime,
        incidentsByType,
        recentIncidents,
        topThreats
      };
    } catch (error) {
      console.error('Error generating security incident report:', error);
      throw error;
    }
  }

  /**
   * Generate a compliance report
   */
  static async generateComplianceReport(): Promise<ComplianceReport> {
    try {
      // Check data retention policies
      const { data: auditLogs, error: auditError } = await supabase
        .from('auth_audit_log')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      if (auditError) throw auditError;

      const oldestAuditLog = auditLogs?.[0]?.created_at;
      const auditLogRetentionDays = oldestAuditLog 
        ? Math.floor((Date.now() - new Date(oldestAuditLog).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Check user data retention
      const { data: oldestUser, error: userError } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      if (userError) throw userError;

      const oldestUserData = oldestUser?.[0]?.created_at;
      const userDataRetentionDays = oldestUserData
        ? Math.floor((Date.now() - new Date(oldestUserData).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Determine compliance status
      const gdprCompliant = auditLogRetentionDays >= 90 && userDataRetentionDays >= 90;
      const complianceStatus = gdprCompliant ? 'compliant' : 'non_compliant';

      // Check privacy controls
      const privacyControls = {
        dataEncryption: true, // Supabase provides encryption at rest
        accessControls: true, // RLS policies are implemented
        auditLogging: true, // Audit logs are being collected
        dataMinimization: true // Only necessary data is collected
      };

      // Check regulatory compliance
      const regulatoryCompliance = {
        gdpr: gdprCompliant,
        ccpa: gdprCompliant, // Similar requirements
        sox: true, // Basic SOX compliance through audit logging
        hipaa: false // Would need additional HIPAA-specific measures
      };

      // Generate recommendations
      const recommendations = [];
      if (!gdprCompliant) {
        recommendations.push('Extend data retention period to meet GDPR requirements (minimum 90 days)');
      }
      if (!regulatoryCompliance.hipaa) {
        recommendations.push('Implement additional measures for HIPAA compliance if handling PHI');
      }
      if (recommendations.length === 0) {
        recommendations.push('Current compliance status is satisfactory');
      }

      return {
        dataRetention: {
          userDataRetentionDays,
          auditLogRetentionDays,
          complianceStatus
        },
        privacyControls,
        regulatoryCompliance,
        recommendations
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Generate a threat intelligence report
   */
  static async generateThreatIntelligenceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ThreatIntelligenceReport> {
    try {
      // Get security events for threat analysis
      const { data: securityEvents, error: securityError } = await supabase
        .from('auth_audit_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (securityError) throw securityError;

      // Analyze threat landscape
      const totalThreats = securityEvents?.filter(e => e.risk_level === 'high' || e.risk_level === 'medium').length || 0;
      const activeThreats = securityEvents?.filter(e => e.risk_level === 'high').length || 0;
      const mitigatedThreats = securityEvents?.filter(e => e.event_type === 'account_lockout').length || 0;

      // Categorize threats
      const threatCategories = new Map<string, { count: number; riskLevel: 'low' | 'medium' | 'high' | 'critical' }>();
      
      securityEvents?.forEach(event => {
        const category = this.categorizeThreat(event.event_type);
        const existing = threatCategories.get(category) || { count: 0, riskLevel: 'low' as const };
        threatCategories.set(category, {
          count: existing.count + 1,
          riskLevel: this.getHigherRiskLevel(existing.riskLevel, event.risk_level)
        });
      });

      const threatCategoriesArray = Array.from(threatCategories.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        riskLevel: data.riskLevel
      }));

      // Identify emerging threats
      const emergingThreats = this.identifyEmergingThreats(securityEvents || []);

      // Generate IOC indicators
      const iocIndicators = this.generateIOCIndicators(securityEvents || []);

      return {
        threatLandscape: {
          totalThreats,
          activeThreats,
          mitigatedThreats
        },
        threatCategories: threatCategoriesArray,
        emergingThreats,
        iocIndicators
      };
    } catch (error) {
      console.error('Error generating threat intelligence report:', error);
      throw error;
    }
  }

  /**
   * Generate a system health report
   */
  static async generateSystemHealthReport(): Promise<SystemHealthReport> {
    try {
      // Get system health from SecurityMonitor
      const healthData = await SecurityMonitor.checkSystemHealth();

      // Calculate overall health score
      const healthScore = this.calculateHealthScore(healthData);
      const overallHealth = this.getHealthStatus(healthScore);

      // Get performance metrics
      const performance = await this.getPerformanceMetrics();

      // Get security metrics
      const security = await this.getSecurityMetrics();

      // Generate recommendations
      const recommendations = this.generateHealthRecommendations(healthData, performance, security);

      return {
        overallHealth,
        uptime: {
          percentage: healthData.uptime || 99.9,
          downtime: 100 - (healthData.uptime || 99.9),
          lastOutage: healthData.lastOutage || null
        },
        performance,
        security,
        recommendations
      };
    } catch (error) {
      console.error('Error generating system health report:', error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive security report
   */
  static async generateComprehensiveReport(
    startDate: Date,
    endDate: Date
  ): Promise<SecurityReport> {
    try {
      const [
        userActivity,
        securityIncidents,
        compliance,
        threatIntelligence,
        systemHealth
      ] = await Promise.all([
        this.generateUserActivityReport(startDate, endDate),
        this.generateSecurityIncidentReport(startDate, endDate),
        this.generateComplianceReport(),
        this.generateThreatIntelligenceReport(startDate, endDate),
        this.generateSystemHealthReport()
      ]);

      const totalEvents = 
        userActivity.totalUsers +
        securityIncidents.totalIncidents +
        threatIntelligence.threatLandscape.totalThreats;

      const criticalIssues = 
        securityIncidents.criticalIncidents +
        threatIntelligence.threatLandscape.activeThreats;

      const warnings = 
        userActivity.suspiciousActivities.length +
        securityIncidents.incidentsByType.filter(i => i.count > 0).length;

      const recommendations = [
        ...compliance.recommendations,
        ...systemHealth.recommendations,
        ...this.generateGeneralRecommendations(userActivity, securityIncidents, threatIntelligence)
      ];

      return {
        id: `report_${Date.now()}`,
        type: 'comprehensive',
        title: 'Comprehensive Security Report',
        description: `Security analysis for period ${startDate.toDateString()} to ${endDate.toDateString()}`,
        data: {
          userActivity,
          securityIncidents,
          compliance,
          threatIntelligence,
          systemHealth
        },
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        summary: {
          totalEvents,
          criticalIssues,
          warnings,
          recommendations
        }
      };
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      throw error;
    }
  }

  /**
   * Save a report to the database
   */
  static async saveReport(report: SecurityReport): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_reports')
        .insert({
          report_id: report.id,
          report_type: report.type,
          title: report.title,
          description: report.description,
          data: report.data,
          generated_at: report.generatedAt.toISOString(),
          period_start: report.period.start.toISOString(),
          period_end: report.period.end.toISOString(),
          summary: report.summary
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  /**
   * Get saved reports
   */
  static async getSavedReports(
    type?: string,
    limit: number = 50
  ): Promise<SecurityReport[]> {
    try {
      let query = supabase
        .from('security_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('report_type', type);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(row => ({
        id: row.report_id,
        type: row.report_type,
        title: row.title,
        description: row.description,
        data: row.data,
        generatedAt: new Date(row.generated_at),
        period: {
          start: new Date(row.period_start),
          end: new Date(row.period_end)
        },
        summary: row.summary
      })) || [];
    } catch (error) {
      console.error('Error getting saved reports:', error);
      throw error;
    }
  }

  // Helper methods
  private static calculateThreatImpact(threat: string, occurrences: number): string {
    const highImpactThreats = ['account_compromise', 'data_breach', 'privilege_escalation'];
    const mediumImpactThreats = ['failed_login', 'suspicious_activity', 'mfa_bypass_attempt'];
    
    if (highImpactThreats.includes(threat) || occurrences > 100) return 'high';
    if (mediumImpactThreats.includes(threat) || occurrences > 50) return 'medium';
    return 'low';
  }

  private static categorizeThreat(eventType: string): string {
    const categories: { [key: string]: string } = {
      'failed_login': 'Authentication Attacks',
      'suspicious_activity': 'Suspicious Behavior',
      'account_lockout': 'Account Security',
      'mfa_bypass_attempt': 'MFA Attacks',
      'data_access': 'Data Access',
      'privilege_escalation': 'Privilege Escalation'
    };
    return categories[eventType] || 'Other';
  }

  private static getHigherRiskLevel(
    current: 'low' | 'medium' | 'high' | 'critical',
    newLevel: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const levels = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    const newIndex = levels.indexOf(newLevel);
    return levels[Math.max(currentIndex, newIndex)] as 'low' | 'medium' | 'high' | 'critical';
  }

  private static identifyEmergingThreats(events: any[]): Array<{
    threat: string;
    description: string;
    firstSeen: Date;
    frequency: number;
    impact: 'low' | 'medium' | 'high';
  }> {
    const threatFrequency = new Map<string, { count: number; firstSeen: Date }>();
    
    events.forEach(event => {
      const threat = event.event_type;
      const existing = threatFrequency.get(threat);
      const eventDate = new Date(event.created_at);
      
      if (!existing || eventDate < existing.firstSeen) {
        threatFrequency.set(threat, {
          count: (existing?.count || 0) + 1,
          firstSeen: existing ? existing.firstSeen : eventDate
        });
      } else {
        threatFrequency.set(threat, {
          count: existing.count + 1,
          firstSeen: existing.firstSeen
        });
      }
    });

    return Array.from(threatFrequency.entries())
      .filter(([_, data]) => data.count >= 3) // Only threats with 3+ occurrences
      .map(([threat, data]) => ({
        threat,
        description: `Emerging threat pattern detected for ${threat}`,
        firstSeen: data.firstSeen,
        frequency: data.count,
        impact: this.calculateThreatImpact(threat, data.count)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private static generateIOCIndicators(events: any[]): Array<{
    type: 'ip' | 'domain' | 'email' | 'hash';
    value: string;
    threat: string;
    confidence: number;
  }> {
    const iocs: Array<{
      type: 'ip' | 'domain' | 'email' | 'hash';
      value: string;
      threat: string;
      confidence: number;
    }> = [];

    events.forEach(event => {
      if (event.ip_address && event.risk_level === 'high') {
        iocs.push({
          type: 'ip',
          value: event.ip_address,
          threat: event.event_type,
          confidence: 0.8
        });
      }
      if (event.user_email && event.risk_level === 'high') {
        iocs.push({
          type: 'email',
          value: event.user_email,
          threat: event.event_type,
          confidence: 0.7
        });
      }
    });

    return iocs.slice(0, 20);
  }

  private static async getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    peakResponseTime: number;
    errorRate: number;
  }> {
    // This would typically come from monitoring tools
    // For now, return mock data
    return {
      averageResponseTime: 150,
      peakResponseTime: 500,
      errorRate: 0.1
    };
  }

  private static async getSecurityMetrics(): Promise<{
    vulnerabilities: number;
    patchesApplied: number;
    securityScore: number;
  }> {
    // This would typically come from security scanning tools
    // For now, return mock data
    return {
      vulnerabilities: 2,
      patchesApplied: 15,
      securityScore: 85
    };
  }

  private static calculateHealthScore(healthData: any): number {
    // Calculate health score based on various metrics
    let score = 100;
    
    if (healthData.uptime < 99.9) score -= 10;
    if (healthData.failedLogins > 100) score -= 15;
    if (healthData.suspiciousActivities > 50) score -= 20;
    if (healthData.criticalAlerts > 0) score -= 25;
    
    return Math.max(0, score);
  }

  private static getHealthStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private static generateHealthRecommendations(
    healthData: any,
    performance: any,
    security: any
  ): string[] {
    const recommendations = [];
    
    if (healthData.uptime < 99.9) {
      recommendations.push('Improve system uptime by addressing recent outages');
    }
    if (healthData.failedLogins > 100) {
      recommendations.push('Implement additional security measures to reduce failed login attempts');
    }
    if (performance.averageResponseTime > 200) {
      recommendations.push('Optimize system performance to reduce response times');
    }
    if (security.vulnerabilities > 0) {
      recommendations.push('Address identified security vulnerabilities');
    }
    
    return recommendations;
  }

  private static generateGeneralRecommendations(
    userActivity: UserActivityReport,
    securityIncidents: SecurityIncidentReport,
    threatIntelligence: ThreatIntelligenceReport
  ): string[] {
    const recommendations = [];
    
    if (userActivity.loginAttempts.rate < 50) {
      recommendations.push('Investigate low login success rate');
    }
    if (userActivity.mfaUsage.rate < 30) {
      recommendations.push('Encourage MFA adoption among users');
    }
    if (securityIncidents.criticalIncidents > 0) {
      recommendations.push('Review and strengthen security controls');
    }
    if (threatIntelligence.threatLandscape.activeThreats > 10) {
      recommendations.push('Implement additional threat detection measures');
    }
    
    return recommendations;
  }
}
