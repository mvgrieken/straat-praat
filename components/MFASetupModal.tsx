import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { MFAService, MFASetupResult } from '@/services/mfaService';

interface MFASetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MFASetupModal({ visible, onClose, onSuccess }: MFASetupModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verification' | 'backup'>('setup');
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<MFASetupResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    if (visible && step === 'setup') {
      initializeMFASetup();
    }
  }, [visible, step]);

  const initializeMFASetup = async () => {
    if (!user?.id || !user?.email) {
      Alert.alert('Fout', 'Gebruiker niet gevonden');
      return;
    }

    setLoading(true);
    try {
      const result = await MFAService.setupMFA(user.id, user.email);
      
      if (result.success && result.secret && result.qrCodeUrl && result.backupCodes) {
        setSetupData(result);
        setBackupCodes(result.backupCodes);
      } else {
        Alert.alert('Fout', result.error || 'MFA setup mislukt');
        onClose();
      }
    } catch (error) {
      Alert.alert('Fout', 'Er is een fout opgetreden bij het instellen van MFA');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!user?.id || !user?.email || !verificationCode.trim()) {
      Alert.alert('Fout', 'Voer een verificatiecode in');
      return;
    }

    setLoading(true);
    try {
      const result = await MFAService.verifyAndActivateMFA(
        user.id,
        user.email,
        verificationCode.trim()
      );

      if (result.success) {
        setStep('backup');
      } else {
        Alert.alert('Fout', result.error || 'Verificatie mislukt');
      }
    } catch (error) {
      Alert.alert('Fout', 'Er is een fout opgetreden bij de verificatie');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    Alert.alert(
      'MFA Geactiveerd',
      'Twee-factor authenticatie is succesvol geactiveerd. Bewaar je backup codes op een veilige plek.',
      [
        {
          text: 'OK',
          onPress: () => {
            onSuccess();
            onClose();
            resetModal();
          }
        }
      ]
    );
  };

  const resetModal = () => {
    setStep('setup');
    setVerificationCode('');
    setSetupData(null);
    setBackupCodes([]);
  };

  const renderSetupStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Twee-factor authenticatie instellen</Text>
      <Text style={styles.description}>
        Scan de QR-code met je authenticator app (zoals Google Authenticator, Authy, of Microsoft Authenticator)
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>MFA wordt ingesteld...</Text>
        </View>
      ) : setupData?.qrCodeUrl ? (
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: setupData.qrCodeUrl }}
            style={styles.qrCode}
            contentFit="contain"
          />
          <Text style={styles.secretText}>
            Secret: {setupData.secret}
          </Text>
          <Text style={styles.secretNote}>
            (Gebruik deze secret als QR-code niet werkt)
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => setStep('verification')}
        disabled={!setupData?.qrCodeUrl}
      >
        <Text style={styles.nextButtonText}>Volgende</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Verificeer je authenticator app</Text>
      <Text style={styles.description}>
        Voer de 6-cijferige code in die wordt weergegeven door je authenticator app
      </Text>

      <View style={styles.inputContainer}>
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('setup')}
        >
          <Text style={styles.backButtonText}>Terug</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerification}
          disabled={loading || verificationCode.length !== 6}
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
        onPress={() => setVerificationCode(MFAService.generateTestTOTPCode())}
      >
        <Text style={styles.testCodeButtonText}>Genereer test code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBackupStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Backup codes</Text>
      <Text style={styles.description}>
        Bewaar deze backup codes op een veilige plek. Je kunt ze gebruiken om in te loggen als je je telefoon verliest.
      </Text>

      <ScrollView style={styles.backupCodesContainer}>
        {backupCodes.map((code, index) => (
          <View key={index} style={styles.backupCodeItem}>
            <Text style={styles.backupCodeText}>{code}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.backupWarning}>
        ⚠️ Bewaar deze codes veilig. Ze kunnen niet opnieuw worden bekeken.
      </Text>

      <TouchableOpacity
        style={styles.completeButton}
        onPress={handleComplete}
      >
        <Text style={styles.completeButtonText}>MFA activeren</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MFA Setup</Text>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 'setup' && styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 'verification' && styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 'backup' && styles.stepDotActive]} />
          </View>
        </View>

        <ScrollView style={styles.content}>
          {step === 'setup' && renderSetupStep()}
          {step === 'verification' && renderVerificationStep()}
          {step === 'backup' && renderBackupStep()}
        </ScrollView>
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
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
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
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  secretText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  secretNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
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
  },
  testCodeButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  backupCodesContainer: {
    maxHeight: 300,
    marginBottom: 24,
  },
  backupCodeItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  backupCodeText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 2,
  },
  backupWarning: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
