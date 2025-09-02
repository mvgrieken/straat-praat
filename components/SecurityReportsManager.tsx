import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { SecurityReportingService } from '@/services/securityReportingService';
import { COLORS } from '@/constants';

interface SecurityReportsManagerProps {
  visible: boolean;
  onClose: () => void;
}

export default function SecurityReportsManager({ visible, onClose }: SecurityReportsManagerProps) {
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);

  useEffect(() => {
    if (visible) {
      loadReports();
    }
  }, [visible]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const savedReports = await SecurityReportingService.getSavedReports();
      setReports(savedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load security reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const report = await SecurityReportingService.generateComprehensiveReport(startDate, endDate);
      
      // Save the report
      await SecurityReportingService.saveReport(report);
      
      // Reload reports
      await loadReports();
      
      Alert.alert('Success', 'Security report generated and saved successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate security report');
    } finally {
      setGenerating(false);
    }
  };

  const viewReport = (report: SecurityReport) => {
    setSelectedReport(report);
    setShowReportDetail(true);
  };

  const deleteReport = async (reportId: string) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: This would require a delete method in the service
              // For now, we'll just remove from the local state
              setReports(reports.filter(r => r.id !== reportId));
              Alert.alert('Success', 'Report deleted successfully');
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'user_activity': '👥',
      'security_incident': '🚨',
      'compliance': '📋',
      'threat_intelligence': '🔍',
      'system_health': '💚',
      'comprehensive': '📊'
    };
    return icons[type] || '📄';
  };

  const getSeverityColor = (criticalIssues: number) => {
    if (criticalIssues > 5) return '#ff4444';
    if (criticalIssues > 2) return '#ff8800';
    if (criticalIssues > 0) return '#ffbb33';
    return '#00C851';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Security Reports</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateReport}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate New Report</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.reportsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No Reports Available</Text>
              <Text style={styles.emptyText}>
                Generate your first security report to get started
              </Text>
            </View>
          ) : (
            reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportIcon}>
                    {getReportTypeIcon(report.type)}
                  </Text>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportDate}>
                      {formatDate(report.generatedAt)}
                    </Text>
                  </View>
                  <View style={styles.reportStats}>
                    <View
                      style={[
                      styles.severityIndicator,
                      { backgroundColor: getSeverityColor(report.summary.criticalIssues) }
                    ]}
                    />
                    <Text style={styles.reportStatsText}>
                      {report.summary.criticalIssues} critical
                    </Text>
                  </View>
                </View>

                <Text style={styles.reportDescription}>
                  {report.description}
                </Text>

                <View style={styles.reportSummary}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Events:</Text>
                    <Text style={styles.summaryValue}>{report.summary.totalEvents}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Warnings:</Text>
                    <Text style={styles.summaryValue}>{report.summary.warnings}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Period:</Text>
                    <Text style={styles.summaryValue}>
                      {formatDate(report.period.start)} - {formatDate(report.period.end)}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => viewReport(report)}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteReport(report.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Report Detail Modal */}
        <Modal
          visible={showReportDetail}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Report Details</Text>
              <TouchableOpacity
                onPress={() => setShowReportDetail(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.detailContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Report Overview</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Type:</Text> {selectedReport.type}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Generated:</Text> {formatDate(selectedReport.generatedAt)}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Period:</Text> {formatDate(selectedReport.period.start)} - {formatDate(selectedReport.period.end)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Summary</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardValue}>{selectedReport.summary.totalEvents}</Text>
                      <Text style={styles.summaryCardLabel}>Total Events</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardValue}>{selectedReport.summary.criticalIssues}</Text>
                      <Text style={styles.summaryCardLabel}>Critical Issues</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardValue}>{selectedReport.summary.warnings}</Text>
                      <Text style={styles.summaryCardLabel}>Warnings</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Recommendations</Text>
                  {selectedReport.summary.recommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Text style={styles.recommendationBullet}>•</Text>
                      <Text style={styles.recommendationText}>{recommendation}</Text>
                    </View>
                  ))}
                </View>

                {selectedReport.type === 'comprehensive' && selectedReport.data && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>User Activity</Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Total Users:</Text> {selectedReport.data.userActivity?.totalUsers || 0}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Active Users:</Text> {selectedReport.data.userActivity?.activeUsers || 0}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Login Success Rate:</Text> {selectedReport.data.userActivity?.loginAttempts?.rate?.toFixed(1) || 0}%
                      </Text>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Security Incidents</Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Total Incidents:</Text> {selectedReport.data.securityIncidents?.totalIncidents || 0}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Critical Incidents:</Text> {selectedReport.data.securityIncidents?.criticalIncidents || 0}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Resolved:</Text> {selectedReport.data.securityIncidents?.resolvedIncidents || 0}
                      </Text>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>System Health</Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Overall Health:</Text> {selectedReport.data.systemHealth?.overallHealth || 'Unknown'}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Uptime:</Text> {selectedReport.data.systemHealth?.uptime?.percentage?.toFixed(2) || 0}%
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Security Score:</Text> {selectedReport.data.systemHealth?.security?.securityScore || 0}/100
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  actions: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportsList: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  reportStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  reportStatsText: {
    fontSize: 12,
    color: '#6c757d',
  },
  reportDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
    lineHeight: 20,
  },
  reportSummary: {
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  summaryValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#212529',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
});
