import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { NOTIFICATION_TYPES } from '@/constants';

import { useSettings } from './useSettings';

export interface NotificationData {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { notificationSettings } = useSettings();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    return true;
  };

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        return null;
      }

      try {
        const pushToken = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        token = pushToken.data;

        // Store token for later use
        if (Platform.OS !== 'web') {
          await AsyncStorage.setItem('expo_push_token', token);
        } else {
          localStorage.setItem('expo_push_token', token);
        }
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.warn('Must use physical device for Push Notifications');
    }

    return token;
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    const type = data?.type;

    switch (type) {
      case NOTIFICATION_TYPES.WORD_OF_DAY:
        // Navigate to home screen
        break;
      case NOTIFICATION_TYPES.STREAK_REMINDER:
        // Navigate to home screen
        break;
      case NOTIFICATION_TYPES.QUIZ_REMINDER:
        // Navigate to quiz screen
        break;
      case NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED:
        // Navigate to profile achievements
        break;
      default:
        // Default action
        break;
    }
  };

  const scheduleWordOfDayNotification = async () => {
    if (!notificationSettings.dailyWordEnabled) return;

    // Cancel existing word of day notifications
    await Notifications.cancelScheduledNotificationAsync('word-of-day');

    const [hours, minutes] = notificationSettings.dailyWordTime.split(':').map(Number);
    
    if (hours === undefined || minutes === undefined) return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'word-of-day',
      content: {
title: 'Woord van de dag',
        body: 'Leer vandaag een nieuw slangwoord!',
        data: { type: NOTIFICATION_TYPES.WORD_OF_DAY },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  };

  const scheduleStreakReminder = async () => {
    if (!notificationSettings.streakReminderEnabled) return;

    // Cancel existing streak reminders
    await Notifications.cancelScheduledNotificationAsync('streak-reminder');

    // Schedule for 8 PM daily
    await Notifications.scheduleNotificationAsync({
      identifier: 'streak-reminder',
      content: {
title: 'Behoud je reeks!',
        body: 'Je hebt vandaag nog niets geleerd. Houd je reeks vol!',
        data: { type: NOTIFICATION_TYPES.STREAK_REMINDER },
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
  };

  const scheduleQuizReminder = async () => {
    if (!notificationSettings.quizReminderEnabled) return;

    // Cancel existing quiz reminders
    await Notifications.cancelScheduledNotificationAsync('quiz-reminder');

    // Schedule weekly quiz reminder (Sunday at 2 PM)
    await Notifications.scheduleNotificationAsync({
      identifier: 'quiz-reminder',
      content: {
title: 'Quiz tijd!',
        body: 'Zin in een uitdaging? Doe een slangquiz!',
        data: { type: NOTIFICATION_TYPES.QUIZ_REMINDER },
      },
      trigger: {
        weekday: 1, // Sunday
        hour: 14,
        minute: 0,
        repeats: true,
      },
    });
  };

  const sendImmediateNotification = async (notificationData: NotificationData) => {
    if (Platform.OS === 'web') {
      // Web notifications require different handling
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(notificationData.title, {
            body: notificationData.body,
            icon: '/icon.png',
          });
        }
      }
      return;
    }

    await Notifications.presentNotificationAsync({
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data || {},
    });
  };

  const sendAchievementNotification = async (achievementName: string) => {
    if (!notificationSettings.achievementNotificationsEnabled) return;

    await sendImmediateNotification({
      type: NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
title: 'Prestatie ontgrendeld!',
      body: `Je hebt "${achievementName}" behaald!`,
      data: { type: NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED, achievementName } as Record<string, any>,
    });
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const updateNotificationSchedules = async () => {
    // Re-schedule all notifications based on current settings
    await Promise.all([
      scheduleWordOfDayNotification(),
      scheduleStreakReminder(),
      scheduleQuizReminder(),
    ]);
  };

  // Check if current time is within do-not-disturb hours
  const isInDoNotDisturbTime = (): boolean => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTimeParts = notificationSettings.doNotDisturbStart.split(':').map(Number);
    const endTimeParts = notificationSettings.doNotDisturbEnd.split(':').map(Number);
    
    const startHour = startTimeParts[0];
    const startMinute = startTimeParts[1];
    const endHour = endTimeParts[0];
    const endMinute = endTimeParts[1];
    
    if (startHour === undefined || startMinute === undefined || endHour === undefined || endMinute === undefined) {
      return false;
    }
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    if (startTime <= endTime) {
      // Same day range
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  // Get notification permission status
  const getNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  };

  return {
    expoPushToken,
    notification,
    requestPermissions,
    scheduleWordOfDayNotification,
    scheduleStreakReminder,
    scheduleQuizReminder,
    sendImmediateNotification,
    sendAchievementNotification,
    cancelAllNotifications,
    updateNotificationSchedules,
    isInDoNotDisturbTime,
    getNotificationStatus,
  };
}
