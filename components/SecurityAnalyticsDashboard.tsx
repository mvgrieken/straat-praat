import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { AuthAnalyticsService } from '@/services/authAnalyticsService';
import { COLORS } from '@/constants';
import { SecurityMonitor } from '@/services/securityMonitor';

import SecurityReportsManager from './SecurityReportsManager';
import SystemHealthMonitor from './SystemHealthMonitor';

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
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export default function SecurityAnalyticsDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [showReportsManager, setShowReportsManager] = useState(false);
  const [showSystemHealth, setShowSystemHealth] = useState(false);

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
      
      // Load security health using new instance-based approach
      const securityMonitor = SecurityMonitor.getInstance();
      const securityMetrics = await securityMonitor.getSecurityMetrics();
      
      // For now, we'll create a simple alerts array since the new API doesn't have getAlerts
      const securityAlerts: SecurityAlert[] = [];

      // Combine metrics
      const combinedMetrics: SecurityMetrics = {
        totalLogins: systemMetrics.totalLogins || 0,
        failedLogins: systemMetrics.failedLogins || 0,
        successRate: systemMetrics.successRate || 0,
        averageLoginTime: systemMetrics.averageLoginTime || 0,
        suspiciousActivity: systemMetrics.suspiciousActivity || 0,
        mfaEnabledUsers: systemMetrics.mfaEnabledUsers || 0,
        securityScore: securityMetrics.successRate || 0,
      };

      setMetrics(combinedMetrics);
      setAlerts(securityAlerts);

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
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Security Analytics</Text>
        <TouchableOpacity
          style={styles.reportsButton}
          onPress={() => setShowReportsManager(true)}
        >
          <Text style={styles.reportsButtonText}>Rapporten</Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
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

      {/* Security Score */}
      {metrics && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Security Score</Text>
          <View style={styles.scoreCircle}>
            <Text
              style={[
                styles.scoreValue,
                { color: getSecurityScoreColor(metrics.securityScore) },
              ]}
            >
              {Math.round(metrics.securityScore)}
            </Text>
            <Text style={styles.scoreUnit}>%</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setShowSystemHealth(true)}
          >
            <Text style={styles.quickActionIcon}>🏥</Text>
            <Text style={styles.quickActionText}>System Health</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setShowReportsManager(true)}
          >
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metrics Grid */}
      {metrics && (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.totalLogins}</Text>
            <Text style={styles.metricLabel}>Totaal Logins</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.failedLogins}</Text>
            <Text style={styles.metricLabel}>Mislukte Logins</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.successRate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Succes Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.suspiciousActivity}</Text>
            <Text style={styles.metricLabel}>Verdachte Activiteit</Text>
          </View>
        </View>
      )}

      {/* Alerts Section */}
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>Security Alerts</Text>
        {alerts.length === 0 ? (
          <View style={styles.noAlerts}>
            <Text style={styles.noAlertsText}>Geen actieve alerts</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View
                  style={[
                    styles.severityIndicator,
                    { backgroundColor: getSeverityColor(alert.severity) },
                  ]}
                />
                <Text style={styles.alertType}>{alert.type}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          ))
        )}
      </View>

      {/* Reports Manager Modal */}
      {showReportsManager && (
        <SecurityReportsManager
          visible={showReportsManager}
          onClose={() => setShowReportsManager(false)}
        />
      )}

      {/* System Health Monitor Modal */}
      <Modal
        visible={showSystemHealth}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SystemHealthMonitor
          visible={showSystemHealth}
          onClose={() => setShowSystemHealth(false)}
        />
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  reportsButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reportsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
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
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E5E7EB',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: -8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  alertsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  noAlerts: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noAlertsText: {
    fontSize: 16,
    color: '#6B7280',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  alertType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  quickActionsSection: {
    padding: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
