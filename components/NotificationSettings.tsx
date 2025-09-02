import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationSettings as NotificationSettingsType } from '@/types';
import NotificationService from '@/services/notificationService';

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsType>({
    word_of_day: true,
    quiz_reminders: true,
    streak_reminders: true,
    achievements: true,
    community_updates: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await NotificationService.getNotificationSettings();
      if (currentSettings) {
        setSettings(currentSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettingsType, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await NotificationService.updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification setting');
      // Revert the change
      setSettings(settings);
    }
  };

  const testNotification = async (type: string) => {
    try {
      switch (type) {
        case 'word_of_day':
          await NotificationService.sendCustomNotification(
            'Woord van de Dag! 🎯',
            'Dit is een test notificatie voor het woord van de dag.',
            { type: 'WORD_OF_DAY' }
          );
          break;
        case 'quiz_reminder':
          await NotificationService.sendCustomNotification(
            'Quiz Tijd! 🧠',
            'Dit is een test notificatie voor quiz herinneringen.',
            { type: 'QUIZ_REMINDER' }
          );
          break;
        case 'streak_reminder':
          await NotificationService.sendCustomNotification(
            'Streak in Gevaar! 🔥',
            'Dit is een test notificatie voor streak herinneringen.',
            { type: 'STREAK_REMINDER' }
          );
          break;
        case 'achievement':
          await NotificationService.sendAchievementNotification('Test Achievement');
          break;
        case 'community_update':
          await NotificationService.sendCommunityUpdateNotification('new_word');
          break;
      }
      Alert.alert('Success', 'Test notificatie verzonden!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const renderSettingItem = (
    key: keyof NotificationSettingsType,
    title: string,
    description: string,
    icon: string,
    testType?: string
  ) => (
    <View key={key} style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <View style={styles.settingInfo}>
          <Ionicons name={icon as any} size={24} color="#3B82F6" style={styles.settingIcon} />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingDescription}>{description}</Text>
          </View>
        </View>
        <Switch
          value={settings[key]}
          onValueChange={(value) => updateSetting(key, value)}
          trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
          thumbColor={settings[key] ? '#FFFFFF' : '#F3F4F6'}
        />
      </View>
      {testType && (
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testNotification(testType)}
        >
          <Ionicons name="play-outline" size={16} color="#3B82F6" />
          <Text style={styles.testButtonText}>Test Notificatie</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificatie Instellingen</Text>
        <Text style={styles.subtitle}>
          Beheer wanneer je notificaties wilt ontvangen
        </Text>
      </View>

      <View style={styles.settingsContainer}>
        {renderSettingItem(
          'word_of_day',
          'Woord van de Dag',
          'Ontvang dagelijks een notificatie met het nieuwe woord van de dag',
          'calendar-outline',
          'word_of_day'
        )}

        {renderSettingItem(
          'quiz_reminders',
          'Quiz Herinneringen',
          'Krijg herinneringen om quizzen te maken en je kennis te testen',
          'game-controller-outline',
          'quiz_reminder'
        )}

        {renderSettingItem(
          'streak_reminders',
          'Streak Herinneringen',
          'Ontvang waarschuwingen wanneer je streak in gevaar is',
          'flame-outline',
          'streak_reminder'
        )}

        {renderSettingItem(
          'achievements',
          'Achievement Notificaties',
          'Vier je prestaties met notificaties wanneer je achievements behaalt',
          'trophy-outline',
          'achievement'
        )}

        {renderSettingItem(
          'community_updates',
          'Community Updates',
          'Blijf op de hoogte van nieuwe woorden en community activiteiten',
          'people-outline',
          'community_update'
        )}
      </View>

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
        <Text style={styles.infoText}>
          Notificaties worden alleen verzonden tijdens actieve uren (9:00 - 21:00)
        </Text>
      </View>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  settingsContainer: {
    padding: 20,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  testButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FEF3C7',
    margin: 20,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
});
