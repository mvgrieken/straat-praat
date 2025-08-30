import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { AuthAnalyticsService } from '@/services/authAnalyticsService';
import { SecurityMonitor } from '@/services/securityMonitor';
import { useAuth } from '@/hooks/useAuth';
import SecurityReportsManager from './SecurityReportsManager';

interface SecurityMetrics {
  totalLogins: number;
  failedLogins: number;
  successRate: number;
  averageLoginTime: number;
  suspiciousActivity: number;
  mfaEnabledUsers: number;
  securityScore: number;
}

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  severity: string;
}

export default function SecurityAnalyticsDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [showReportsManager, setShowReportsManager] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, [selectedPeriod]);

  const loadSecurityData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Load system metrics
      const systemMetrics = await AuthAnalyticsService.getSystemAuthMetrics(7);
      
      // Load user-specific metrics
      const userStats = await AuthAnalyticsService.getLoginStats(user.id, 7);
      
      // Load security health
      const healthStatus = await SecurityMonitor.checkSystemHealth();
      
      // Load alerts
      const securityAlerts = SecurityMonitor.getAlerts();

      // Combine metrics
      const combinedMetrics: SecurityMetrics = {
        totalLogins: systemMetrics.totalLogins || 0,
        failedLogins: systemMetrics.failedLogins || 0,
        successRate: systemMetrics.successRate || 0,
        averageLoginTime: systemMetrics.averageLoginTime || 0,
        suspiciousActivity: systemMetrics.suspiciousActivity || 0,
        mfaEnabledUsers: systemMetrics.mfaEnabledUsers || 0,
        securityScore: healthStatus.overallScore || 0,
      };

      setMetrics(combinedMetrics);
      setAlerts(securityAlerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        message: alert.message,
        timestamp: alert.timestamp,
        severity: alert.severity,
      })));

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return 'Uitstekend';
    if (score >= 60) return 'Goed';
    if (score >= 40) return 'Gemiddeld';
    return 'Slecht';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🔴';
      case 'error': return '🟠';
      case 'warning': return '🟡';
      default: return 'ℹ️';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Security data laden...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Security Analytics</Text>
        <View style={styles.periodSelector}>
          {(['24h', '7d', '30d'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {metrics && (
        <>
          {/* Security Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreTitle}>Security Score</Text>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreValue, { color: getSecurityScoreColor(metrics.securityScore) }]}>
                {metrics.securityScore}
              </Text>
              <Text style={styles.scoreLabel}>
                {getSecurityScoreLabel(metrics.securityScore)}
              </Text>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(metrics.totalLogins)}</Text>
              <Text style={styles.metricLabel}>Totaal Logins</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(metrics.failedLogins)}</Text>
              <Text style={styles.metricLabel}>Mislukte Logins</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.successRate.toFixed(1)}%</Text>
              <Text style={styles.metricLabel}>Succes Rate</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatTime(metrics.averageLoginTime)}</Text>
              <Text style={styles.metricLabel}>Gem. Login Tijd</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(metrics.suspiciousActivity)}</Text>
              <Text style={styles.metricLabel}>Verdachte Activiteit</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(metrics.mfaEnabledUsers)}</Text>
              <Text style={styles.metricLabel}>MFA Gebruikers</Text>
            </View>
          </View>

          {/* Security Alerts */}
          <View style={styles.alertsContainer}>
            <Text style={styles.sectionTitle}>Security Alerts</Text>
            {alerts.length === 0 ? (
              <View style={styles.noAlertsContainer}>
                <Text style={styles.noAlertsIcon}>✅</Text>
                <Text style={styles.noAlertsText}>Geen actieve alerts</Text>
              </View>
            ) : (
              alerts.map((alert) => (
                <View key={alert.id} style={styles.alertItem}>
                  <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTimestamp}>
                      {new Date(alert.timestamp).toLocaleString('nl-NL')}
                    </Text>
                  </View>
                  <View style={[styles.alertSeverity, { backgroundColor: getSecurityScoreColor(alert.severity === 'high' ? 30 : 70) }]}>
                    <Text style={styles.alertSeverityText}>{alert.severity}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowReportsManager(true)}
              >
                <Text style={styles.actionButtonText}>Security Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Alerts Beheren</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>MFA Instellingen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Security Reports Manager Modal */}
      <SecurityReportsManager
        visible={showReportsManager}
        onClose={() => setShowReportsManager(false)}
      />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  scoreContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  noAlertsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noAlertsIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#6B7280',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertSeverity: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  alertSeverityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  actionsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
