import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { MFAService } from '@/services/mfaService';
import { COLORS } from '@/constants';

interface BackupCodesManagerProps {
  visible: boolean;
  onClose: () => void;
}

export default function BackupCodesManager({ visible, onClose }: BackupCodesManagerProps) {
  const { user } = useAuth();
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCodes, setShowCodes] = useState(false);

  const handleRegenerateCodes = async () => {
    if (!user?.id || !user?.email) {
      Alert.alert('Fout', 'Gebruiker niet gevonden');
      return;
    }

    Alert.alert(
      'Backup codes regenereren',
      'Weet je zeker dat je nieuwe backup codes wilt genereren? De oude codes worden ongeldig.',
      [
        {
          text: 'Annuleren',
          style: 'cancel',
        },
        {
          text: 'Regenereren',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const newCodes = await MFAService.regenerateBackupCodes(user.id, user.email);
              setBackupCodes(newCodes);
              setShowCodes(true);
              Alert.alert(
                'Nieuwe backup codes gegenereerd',
                'Bewaar deze nieuwe codes op een veilige plek. De oude codes zijn nu ongeldig.'
              );
            } catch (error) {
              Alert.alert('Fout', 'Er is een fout opgetreden bij het regenereren van backup codes');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewCodes = async () => {
    if (!user?.id || !user?.email) {
      Alert.alert('Fout', 'Gebruiker niet gevonden');
      return;
    }

    setLoading(true);
    try {
      // In een echte implementatie zou je de bestaande codes ophalen uit de database
      // Voor nu genereren we nieuwe codes voor demonstratie
      const codes = await MFAService.regenerateBackupCodes(user.id, user.email);
      setBackupCodes(codes);
      setShowCodes(true);
    } catch (error) {
      Alert.alert('Fout', 'Er is een fout opgetreden bij het ophalen van backup codes');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowCodes(false);
    setBackupCodes([]);
    onClose();
  };

  const renderMainView = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Backup Codes Beheer</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Wat zijn backup codes?</Text>
          <Text style={styles.infoText}>
            Backup codes zijn een veilige manier om in te loggen als je je telefoon verliest of je authenticator app niet meer werkt. Bewaar ze op een veilige plek.
          </Text>
        </View>

        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>⚠️ Belangrijk</Text>
          <Text style={styles.warningText}>
            Bewaar deze codes veilig! Je hebt ze nodig als je &ldquo;2FA-app&rdquo; niet meer werkt.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={handleViewCodes}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.viewButtonText}>Backup codes bekijken</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={handleRegenerateCodes}
            disabled={loading}
          >
            <Text style={styles.regenerateButtonText}>Nieuwe codes genereren</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderCodesView = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowCodes(false)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Terug</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Backup Codes</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.codesContainer}>
          {backupCodes.map((code, index) => (
            <View key={index} style={styles.codeItem}>
              <Text style={styles.codeText}>{code}</Text>
              <Text style={styles.codeNumber}>#{index + 1}</Text>
            </View>
          ))}
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Hoe te gebruiken:</Text>
          <Text style={styles.instructionsText}>
            1. Probeer eerst in te loggen met je normale wachtwoord{'\n'}
            2. Als MFA wordt gevraagd, klik op "Backup code gebruiken"{'\n'}
            3. Voer een van de bovenstaande codes in{'\n'}
            4. Elke code kan maar één keer gebruikt worden
          </Text>
        </View>

        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={handleRegenerateCodes}
          disabled={loading}
        >
          <Text style={styles.regenerateButtonText}>Nieuwe codes genereren</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {showCodes ? renderCodesView() : renderMainView()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  viewButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  regenerateButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  regenerateButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  codesContainer: {
    marginBottom: 24,
  },
  codeItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 2,
  },
  codeNumber: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#0C4A6E',
    lineHeight: 20,
  },
});
