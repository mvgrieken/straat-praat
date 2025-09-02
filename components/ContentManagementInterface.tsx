import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { CommunityModerationService, CommunityContribution } from '@/services/communityModerationService';
import { AITranslationService } from '@/services/aiTranslationService';

interface ContentManagementInterfaceProps {
  onClose: () => void;
}

export const ContentManagementInterface: React.FC<ContentManagementInterfaceProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [pendingContributions, setPendingContributions] = useState<CommunityContribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<CommunityContribution | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'stats' | 'ai'>('pending');

  useEffect(() => {
    if (user) {
      loadPendingContributions();
      loadModerationStats();
    }
  }, [user]);

  const loadPendingContributions = async () => {
    try {
      setLoading(true);
      const contributions = await CommunityModerationService.getPendingContributions();
      setPendingContributions(contributions);
    } catch (error) {
      console.error('Failed to load pending contributions:', error);
      Alert.alert('Fout', 'Kon bijdragen niet laden');
    } finally {
      setLoading(false);
    }
  };

  const loadModerationStats = async () => {
    try {
      const moderationStats = await CommunityModerationService.getModerationStats();
      setStats(moderationStats);
    } catch (error) {
      console.error('Failed to load moderation stats:', error);
    }
  };

  const handleModeration = async (contributionId: string, action: 'approve' | 'reject') => {
    if (!user) return;

    try {
      setLoading(true);
      
      const success = await CommunityModerationService.processModeration({
        contributionId,
        moderatorId: user.id,
        action,
        notes: moderationNotes,
      });

      if (success) {
        Alert.alert(
          'Succes',
          `Bijdrage succesvol ${action === 'approve' ? 'goedgekeurd' : 'afgekeurd'}`
        );
        
        // Refresh data
        await loadPendingContributions();
        await loadModerationStats();
        
        // Reset form
        setSelectedContribution(null);
        setModerationNotes('');
      } else {
        Alert.alert('Fout', 'Kon moderatie niet verwerken');
      }
    } catch (error) {
      console.error('Moderation failed:', error);
      Alert.alert('Fout', 'Er is een fout opgetreden bij de moderatie');
    } finally {
      setLoading(false);
    }
  };

  const checkAIServiceHealth = async () => {
    try {
      setLoading(true);
      const isHealthy = await AITranslationService.checkServiceHealth();
      
      Alert.alert(
        'AI Service Status',
        isHealthy ? 'AI service is beschikbaar' : 'AI service is niet beschikbaar'
      );
    } catch (error) {
      Alert.alert('Fout', 'Kon AI service status niet controleren');
    } finally {
      setLoading(false);
    }
  };

  const renderPendingContributions = () => {
    return (
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Wachtende Bijdragen ({pendingContributions.length})</Text>
        
        {pendingContributions.length === 0 ? (
          <Text style={styles.emptyText}>Geen wachtende bijdragen</Text>
        ) : (
          pendingContributions.map((contribution) => (
            <View key={contribution.id} style={styles.contributionCard}>
              <View style={styles.contributionHeader}>
                <Text style={styles.wordText}>{contribution.word}</Text>
                <Text style={styles.statusText}>Wachtend</Text>
              </View>
              
              <Text style={styles.meaningText}>Betekenis: {contribution.meaning}</Text>
              
              {contribution.context && (
                <Text style={styles.contextText}>Context: {contribution.context}</Text>
              )}
              
              <Text style={styles.dateText}>
                Ingediend: {new Date(contribution.createdAt).toLocaleDateString('nl-NL')}
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => setSelectedContribution(contribution)}
                >
                  <Text style={styles.buttonText}>Goedkeuren</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => {
                    setSelectedContribution(contribution);
                    handleModeration(contribution.id, 'reject');
                  }}
                >
                  <Text style={styles.buttonText}>Afkeuren</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderModerationStats = () => {
    return (
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Moderatie Statistieken</Text>
        
        {stats ? (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalPending}</Text>
                <Text style={styles.statLabel}>Wachtend</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalApproved}</Text>
                <Text style={styles.statLabel}>Goedgekeurd</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalRejected}</Text>
                <Text style={styles.statLabel}>Afgekeurd</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {Math.round(stats.averageProcessingTime / (1000 * 60 * 60))}u
                </Text>
                <Text style={styles.statLabel}>Gem. Verwerkingstijd</Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>Moderator Prestaties</Text>
            {stats.moderatorPerformance.map((moderator: any) => (
              <View key={moderator.moderatorId} style={styles.moderatorCard}>
                <Text style={styles.moderatorName}>{moderator.moderatorName}</Text>
                <Text style={styles.moderatorStats}>
                  {moderator.contributionsProcessed} bijdragen verwerkt
                </Text>
                <Text style={styles.moderatorStats}>
                  Gem. tijd: {Math.round(moderator.averageProcessingTime / (1000 * 60 * 60))}u
                </Text>
              </View>
            ))}
          </>
        ) : (
          <ActivityIndicator size="large" color="#007AFF" />
        )}
      </ScrollView>
    );
  };

  const renderAIServiceTab = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>AI Service Beheer</Text>
      
      <TouchableOpacity
        style={styles.aiHealthButton}
        onPress={checkAIServiceHealth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Controleer AI Service Status</Text>
      </TouchableOpacity>
      
      <View style={styles.aiInfoCard}>
        <Text style={styles.aiInfoTitle}>AI Vertaalservice</Text>
        <Text style={styles.aiInfoText}>
          Deze service gebruikt OpenAI's GPT model om zinnen te vertalen tussen Straat-Praat en formeel Nederlands.
        </Text>
        <Text style={styles.aiInfoText}>
          Voor losse woorden wordt de lokale database gebruikt, voor zinnen wordt de AI service aangeroepen.
        </Text>
      </View>
      
      <View style={styles.aiInfoCard}>
        <Text style={styles.aiInfoTitle}>Configuratie</Text>
        <Text style={styles.aiInfoText}>
          API Key: {process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'Geconfigureerd' : 'Niet geconfigureerd'}
        </Text>
        <Text style={styles.aiInfoText}>
          Model: GPT-3.5-turbo
        </Text>
        <Text style={styles.aiInfoText}>
          Max Tokens: 150
        </Text>
      </View>
    </View>
  );

  const renderModerationModal = () => {
    if (!selectedContribution) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Moderatie Notities</Text>
          
          <Text style={styles.modalWord}>Woord: {selectedContribution.word}</Text>
          
          <TextInput
            style={styles.notesInput}
            placeholder="Voeg notities toe (optioneel)..."
            value={moderationNotes}
            onChangeText={setModerationNotes}
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setSelectedContribution(null)}
            >
              <Text style={styles.buttonText}>Annuleren</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.approveButton]}
              onPress={() => handleModeration(selectedContribution.id, 'approve')}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verwerken...' : 'Goedkeuren'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content Beheer</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Wachtend ({pendingContributions.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Statistieken
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>
            AI Service
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'pending' && renderPendingContributions()}
      {activeTab === 'stats' && renderModerationStats()}
      {activeTab === 'ai' && renderAIServiceTab()}
      
      {renderModerationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  contributionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  meaningText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  contextText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  moderatorCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moderatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  moderatorStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  aiHealthButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  aiInfoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  aiInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalWord: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
});
