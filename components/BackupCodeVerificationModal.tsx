import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';

import { MFAService } from '@/services/mfaService';

interface BackupCodeVerificationModalProps {
  visible: boolean;
  userId: string;
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BackupCodeVerificationModal({
  visible,
  userId,
  email,
  onSuccess,
  onCancel,
}: BackupCodeVerificationModalProps) {
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleVerification = async () => {
    if (!backupCode.trim()) {
      Alert.alert('Fout', 'Voer een backup code in');
      return;
    }

    setLoading(true);
    try {
      const result = await MFAService.verifyBackupCode(
        userId,
        email,
        backupCode.trim()
      );

      if (result.success) {
        Alert.alert(
          'Backup code geaccepteerd',
          'Je bent succesvol ingelogd met je backup code.',
          [
            {
              text: 'OK',
              onPress: onSuccess,
            },
          ]
        );
      } else {
        setAttempts((prev) => prev + 1);
        setBackupCode('');
        
        if (attempts >= 2) {
          Alert.alert(
            'Toegang geweigerd',
            'Je hebt te veel onjuiste backup codes ingevoerd. Neem contact op met de beheerder.',
            [
              {
                text: 'OK',
                onPress: onCancel,
              },
            ]
          );
        } else {
          Alert.alert('Fout', result.error || 'Ongeldige backup code');
        }
      }
    } catch (error) {
      Alert.alert('Fout', 'Er is een fout opgetreden bij de verificatie');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTestCode = () => {
    // Genereer een test backup code (8 karakters, alleen hoofdletters en cijfers)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setBackupCode(code);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Annuleren</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Backup Code</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔑</Text>
          </View>

          <Text style={styles.title}>Backup code vereist</Text>
          <Text style={styles.description}>
            Voer een van je backup codes in om in te loggen. Elke code kan maar één keer gebruikt worden.
          </Text>

          <View style={styles.codeInputContainer}>
            <Text style={styles.inputLabel}>Backup Code</Text>
            <View style={styles.codeInput}>
              <Text style={styles.codeInputText}>
                {backupCode || 'ABCD1234'}
              </Text>
            </View>
            <Text style={styles.inputHint}>
              Voer een 8-karakter backup code in
            </Text>
          </View>

          {attempts > 0 && (
            <View style={styles.attemptsContainer}>
              <Text style={styles.attemptsText}>
                Mislukte pogingen: {attempts}/3
              </Text>
              {attempts >= 2 && (
                <Text style={styles.warningText}>
                  ⚠️ Na 3 mislukte pogingen wordt toegang geblokkeerd
                </Text>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
              onPress={handleVerification}
              disabled={loading || backupCode.length !== 8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verificeer</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.testCodeButton}
            onPress={handleGenerateTestCode}
          >
            <Text style={styles.testCodeButtonText}>Test code genereren</Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Backup codes verloren?</Text>
            <Text style={styles.infoText}>
              • Controleer of je de codes hebt opgeslagen{'\n'}
              • Zoek in je e-mail naar backup codes{'\n'}
              • Neem contact op met de beheerder als je geen codes hebt
            </Text>
          </View>

          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>⚠️ Belangrijk</Text>
            <Text style={styles.warningText}>
              • Elke backup code kan maar één keer gebruikt worden{'\n'}
              • Na gebruik wordt de code ongeldig{'\n'}
              • Genereer nieuwe codes als je ze allemaal hebt gebruikt
            </Text>
          </View>
        </View>
      </View>
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
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  codeInputText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  inputHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  attemptsContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  attemptsText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  verifyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testCodeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  testCodeButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  infoContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0C4A6E',
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
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
});
