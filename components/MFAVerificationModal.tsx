import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MFAService, MFAVerificationResult } from '@/services/mfaService';

interface MFAVerificationModalProps {
  visible: boolean;
  userId: string;
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
  onBackupCode: () => void;
}

export default function MFAVerificationModal({
  visible,
  userId,
  email,
  onSuccess,
  onCancel,
  onBackupCode,
}: MFAVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (visible) {
      setVerificationCode('');
      setAttempts(0);
      setTimeRemaining(0);
    }
  }, [visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timeRemaining]);

  const handleVerification = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      Alert.alert('Fout', 'Voer een geldige 6-cijferige code in');
      return;
    }

    setLoading(true);
    try {
      const result = await MFAService.verifyMFACode(
        userId,
        email,
        verificationCode.trim()
      );

      if (result.success) {
        onSuccess();
      } else {
        setAttempts((prev) => prev + 1);
        setVerificationCode('');
        
        if (attempts >= 2) {
          // Na 3 mislukte pogingen, toon backup code optie
          Alert.alert(
            'Verificatie mislukt',
            'Je hebt meerdere mislukte pogingen gehad. Wil je een backup code gebruiken?',
            [
              {
                text: 'Nee',
                style: 'cancel',
              },
              {
                text: 'Backup code gebruiken',
                onPress: onBackupCode,
              },
            ]
          );
        } else {
          Alert.alert('Fout', result.error || 'Verificatie mislukt');
        }
      }
    } catch (error) {
      Alert.alert('Fout', 'Er is een fout opgetreden bij de verificatie');
    } finally {
      setLoading(false);
    }
  };

  const handleTestCode = () => {
    setVerificationCode(MFAService.generateTestTOTPCode());
  };

  const handleBackupCode = () => {
    onBackupCode();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <Text style={styles.headerTitle}>Twee-factor authenticatie</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔐</Text>
          </View>

          <Text style={styles.title}>Verificatie vereist</Text>
          <Text style={styles.description}>
            Voer de 6-cijferige code in die wordt weergegeven door je authenticator app
          </Text>

          <View style={styles.codeInputContainer}>
            <Text style={styles.inputLabel}>Verificatiecode</Text>
            <View style={styles.codeInput}>
              <Text style={styles.codeInputText}>
                {verificationCode || '000000'}
              </Text>
            </View>
            <Text style={styles.inputHint}>
              Voer de 6-cijferige code in
            </Text>
          </View>

          {attempts > 0 && (
            <View style={styles.attemptsContainer}>
              <Text style={styles.attemptsText}>
                Mislukte pogingen: {attempts}/3
              </Text>
              {attempts >= 2 && (
                <Text style={styles.warningText}>
                  ⚠️ Na 3 mislukte pogingen kun je een backup code gebruiken
                </Text>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
              onPress={handleVerification}
              disabled={loading || verificationCode.length !== 6 || timeRemaining > 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verificeer</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.helperButtons}>
            <TouchableOpacity
              style={styles.helperButton}
              onPress={handleTestCode}
            >
              <Text style={styles.helperButtonText}>Test code genereren</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helperButton}
              onPress={handleBackupCode}
            >
              <Text style={styles.helperButtonText}>Backup code gebruiken</Text>
            </TouchableOpacity>
          </View>

          {timeRemaining > 0 && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                Wacht {formatTime(timeRemaining)} voordat je opnieuw probeert
              </Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Problemen met inloggen?</Text>
            <Text style={styles.infoText}>
              • Controleer of je authenticator app de juiste tijd heeft{'\n'}
              • Zorg ervoor dat je de juiste account hebt geselecteerd{'\n'}
              • Gebruik een backup code als je je telefoon hebt verloren
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 4,
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
  helperButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  helperButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  helperButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  timerContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
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
});
