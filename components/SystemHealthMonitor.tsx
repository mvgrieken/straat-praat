import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';

import { SecurityMonitor, SystemHealth, PerformanceMetrics } from '@/services/securityMonitor';

interface SystemHealthMonitorProps {
  visible: boolean;
  onClose: () => void;
}

export default function SystemHealthMonitor({ visible, onClose }: SystemHealthMonitorProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState<{ isMonitoring: boolean; checkInterval: number } | null>(null);

  useEffect(() => {
    if (visible) {
      loadSystemHealth();
      loadMonitoringStatus();
    }
  }, [visible]);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      const securityMonitor = SecurityMonitor.getInstance();
      const systemMetrics = await securityMonitor.getSystemMetrics();
      
      setHealth(systemMetrics.health);
      setPerformance(systemMetrics.performance);
    } catch (error) {
      console.error('Error loading system health:', error);
      Alert.alert('Error', 'Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoringStatus = () => {
    const securityMonitor = SecurityMonitor.getInstance();
    const status = securityMonitor.getMonitoringStatus();
    setMonitoringStatus(status);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSystemHealth();
    loadMonitoringStatus();
    setRefreshing(false);
  };

  const toggleMonitoring = () => {
    const securityMonitor = SecurityMonitor.getInstance();
    
    if (monitoringStatus?.isMonitoring) {
      securityMonitor.stopMonitoring().catch(error => {
        console.warn('Failed to stop security monitoring:', error);
      });
    } else {
      securityMonitor.startMonitoring().catch(error => {
        console.warn('Failed to start security monitoring:', error);
      });
    }
    
    loadMonitoringStatus();
  };

  const getHealthColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return '#10B981';
      case 'degraded':
        return '#F59E0B';
      case 'unhealthy':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getHealthIcon = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatResponseTime = (time: number) => {
    return `${time.toFixed(0)}ms`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Health Monitor</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading system health...</Text>
          </View>
        ) : (
          <>
            {/* Monitoring Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monitoring Status</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <View style={styles.statusIndicator}>
                    <Text style={styles.statusDot}>
                      {monitoringStatus?.isMonitoring ? '🟢' : '🔴'}
                    </Text>
                    <Text style={styles.statusText}>
                      {monitoringStatus?.isMonitoring ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Check Interval:</Text>
                  <Text style={styles.statusValue}>
                    {monitoringStatus ? Math.round(monitoringStatus.checkInterval / 1000 / 60) : 0} minutes
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { backgroundColor: monitoringStatus?.isMonitoring ? '#EF4444' : '#10B981' }
                  ]}
                  onPress={toggleMonitoring}
                >
                  <Text style={styles.toggleButtonText}>
                    {monitoringStatus?.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* System Health */}
            {health && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>System Health</Text>
                <View style={styles.healthCard}>
                  <View style={styles.overallHealth}>
                    <Text style={styles.overallHealthLabel}>Overall Status</Text>
                    <View style={styles.overallHealthIndicator}>
                      <Text style={styles.healthIcon}>{getHealthIcon(health.overall)}</Text>
                      <Text style={[styles.healthStatus, { color: getHealthColor(health.overall) }]}>
                        {health.overall.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.healthComponents}>
                    <View style={styles.healthComponent}>
                      <Text style={styles.componentLabel}>Database</Text>
                      <View style={styles.componentStatus}>
                        <Text style={styles.componentIcon}>{getHealthIcon(health.database)}</Text>
                        <Text style={[styles.componentText, { color: getHealthColor(health.database) }]}>
                          {health.database}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.healthComponent}>
                      <Text style={styles.componentLabel}>Authentication</Text>
                      <View style={styles.componentStatus}>
                        <Text style={styles.componentIcon}>{getHealthIcon(health.authentication)}</Text>
                        <Text style={[styles.componentText, { color: getHealthColor(health.authentication) }]}>
                          {health.authentication}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.healthComponent}>
                      <Text style={styles.componentLabel}>API</Text>
                      <View style={styles.componentStatus}>
                        <Text style={styles.componentIcon}>{getHealthIcon(health.api)}</Text>
                        <Text style={[styles.componentText, { color: getHealthColor(health.api) }]}>
                          {health.api}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.healthMetrics}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Uptime:</Text>
                      <Text style={styles.metricValue}>{formatUptime(health.uptime)}</Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Last Checked:</Text>
                      <Text style={styles.metricValue}>
                        {new Date(health.lastChecked).toLocaleString()}
                      </Text>
                    </View>
                    {health.lastOutage && (
                      <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Last Outage:</Text>
                        <Text style={styles.metricValue}>
                          {health.lastOutage.toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Performance Metrics */}
            {performance && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Metrics</Text>
                <View style={styles.performanceCard}>
                  <View style={styles.performanceGrid}>
                    <View style={styles.performanceMetric}>
                      <Text style={styles.metricTitle}>Avg Response Time</Text>
                      <Text style={styles.metricValue}>{formatResponseTime(performance.averageResponseTime)}</Text>
                    </View>
                    
                    <View style={styles.performanceMetric}>
                      <Text style={styles.metricTitle}>Peak Response Time</Text>
                      <Text style={styles.metricValue}>{formatResponseTime(performance.peakResponseTime)}</Text>
                    </View>
                    
                    <View style={styles.performanceMetric}>
                      <Text style={styles.metricTitle}>Error Rate</Text>
                      <Text style={styles.metricValue}>{formatPercentage(performance.errorRate)}</Text>
                    </View>
                    
                    <View style={styles.performanceMetric}>
                      <Text style={styles.metricTitle}>Throughput</Text>
                      <Text style={styles.metricValue}>{performance.throughput.toLocaleString()}/s</Text>
                    </View>
                  </View>
                  
                  <View style={styles.latencySection}>
                    <Text style={styles.latencyTitle}>Latency Percentiles</Text>
                    <View style={styles.latencyGrid}>
                      <View style={styles.latencyMetric}>
                        <Text style={styles.latencyLabel}>P50</Text>
                        <Text style={styles.latencyValue}>{formatResponseTime(performance.latency.p50)}</Text>
                      </View>
                      <View style={styles.latencyMetric}>
                        <Text style={styles.latencyLabel}>P95</Text>
                        <Text style={styles.latencyValue}>{formatResponseTime(performance.latency.p95)}</Text>
                      </View>
                      <View style={styles.latencyMetric}>
                        <Text style={styles.latencyLabel}>P99</Text>
                        <Text style={styles.latencyValue}>{formatResponseTime(performance.latency.p99)}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.resourceSection}>
                    <Text style={styles.resourceTitle}>Resource Usage</Text>
                    <View style={styles.resourceGrid}>
                      <View style={styles.resourceMetric}>
                        <Text style={styles.resourceLabel}>CPU</Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${performance.resourceUsage.cpu}%`, backgroundColor: '#3B82F6' }
                            ]} 
                          />
                        </View>
                        <Text style={styles.resourceValue}>{performance.resourceUsage.cpu}%</Text>
                      </View>
                      
                      <View style={styles.resourceMetric}>
                        <Text style={styles.resourceLabel}>Memory</Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${performance.resourceUsage.memory}%`, backgroundColor: '#10B981' }
                            ]} 
                          />
                        </View>
                        <Text style={styles.resourceValue}>{performance.resourceUsage.memory}%</Text>
                      </View>
                      
                      <View style={styles.resourceMetric}>
                        <Text style={styles.resourceLabel}>Database</Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${performance.resourceUsage.database}%`, backgroundColor: '#F59E0B' }
                            ]} 
                          />
                        </View>
                        <Text style={styles.resourceValue}>{performance.resourceUsage.database}%</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.lastUpdated}>
                    <Text style={styles.lastUpdatedText}>
                      Last updated: {new Date(performance.lastUpdated).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#374151',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  toggleButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallHealth: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  overallHealthLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  overallHealthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  healthStatus: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  healthComponents: {
    marginBottom: 20,
  },
  healthComponent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  componentLabel: {
    fontSize: 16,
    color: '#374151',
  },
  componentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  componentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  componentText: {
    fontSize: 16,
    fontWeight: '500',
  },
  healthMetrics: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  performanceMetric: {
    width: '50%',
    marginBottom: 16,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  latencySection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  latencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  latencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  latencyMetric: {
    alignItems: 'center',
  },
  latencyLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  latencyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resourceSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  resourceGrid: {
    gap: 12,
  },
  resourceMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceLabel: {
    fontSize: 14,
    color: '#374151',
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  resourceValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  lastUpdated: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
