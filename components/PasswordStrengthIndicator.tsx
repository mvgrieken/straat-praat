import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from '@/constants';
import { PasswordSecurityService, PasswordStrength } from '@/services/passwordSecurityService';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

export default function PasswordStrengthIndicator({ 
  password, 
  showDetails = true 
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const validation = PasswordSecurityService.validatePassword(password);
  const strength = validation.strength;
  const color = PasswordSecurityService.getStrengthColor(strength);
  const label = PasswordSecurityService.getStrengthLabel(strength);

  const getProgressWidth = () => {
    switch (strength) {
      case 'very_weak': return '20%';
      case 'weak': return '40%';
      case 'medium': return '60%';
      case 'strong': return '80%';
      case 'very_strong': return '100%';
      default: return '0%';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.strengthBar}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: getProgressWidth(),
              backgroundColor: color 
            }
          ]} 
        />
      </View>
      
      <View style={styles.strengthInfo}>
        <Text style={[styles.strengthLabel, { color }]}>
          {label}
        </Text>
        <Text style={styles.scoreText}>
          Score: {validation.score}/100
        </Text>
      </View>

      {showDetails && validation.errors.length > 0 && (
        <View style={styles.errorsContainer}>
          {validation.errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      {showDetails && PasswordSecurityService.isCommonPassword(password) && (
        <Text style={styles.warningText}>
          ⚠️ Dit is een veelgebruikt wachtwoord. Kies een uniek wachtwoord voor betere beveiliging.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorsContainer: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
