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
    }).catch(error => {
      console.warn('Error registering for push notifications:', error);
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

    try {
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
    } catch (error) {
      console.warn('Error requesting notification permissions:', error);
      return false;
    }
  };

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token = null;

    try {
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
            await AsyncStorage.setItem('expoPushToken', token);
          }
        } catch (error) {
          console.warn('Error getting push token:', error);
          // Don't throw here, just return null
          return null;
        }
      } else {
        console.warn('Must use physical device for Push Notifications');
      }
    } catch (error) {
      console.warn('Error in registerForPushNotificationsAsync:', error);
    }

    return token;
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;
    
    if (data?.type === NOTIFICATION_TYPES.WORD_OF_DAY) {
      // Navigate to word of the day
      console.log('Navigate to word of the day');
    } else if (data?.type === NOTIFICATION_TYPES.QUIZ_REMINDER) {
      // Navigate to quiz
      console.log('Navigate to quiz');
    } else if (data?.type === NOTIFICATION_TYPES.STREAK_REMINDER) {
      // Navigate to profile
      console.log('Navigate to profile');
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: Record<string, any>
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger,
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  };

  const scheduleWordOfDayNotification = async (hour: number = 10) => {
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, 0, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await scheduleLocalNotification(
      'Woord van de Dag',
      'Leer vandaag een nieuw slangwoord!',
      {
        date: scheduledTime,
        repeats: true,
      },
      {
        type: NOTIFICATION_TYPES.WORD_OF_DAY,
      }
    );
  };

  const scheduleStreakReminder = async (hour: number = 20) => {
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, 0, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await scheduleLocalNotification(
      'Streak Alert',
      'Vergeet niet vandaag te leren om je streak te behouden!',
      {
        date: scheduledTime,
        repeats: true,
      },
      {
        type: NOTIFICATION_TYPES.STREAK_REMINDER,
      }
    );
  };

  const scheduleQuizReminder = async (dayOfWeek: number = 1, hour: number = 18) => {
    // Schedule for next occurrence of the specified day of week (0 = Sunday, 1 = Monday, etc.)
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, 0, 0, 0);

    // Calculate days until next occurrence
    const daysUntilNext = (dayOfWeek - scheduledTime.getDay() + 7) % 7;
    if (daysUntilNext === 0 && scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 7);
    } else {
      scheduledTime.setDate(scheduledTime.getDate() + daysUntilNext);
    }

    await scheduleLocalNotification(
      'Quiz Tijd!',
      'Test je kennis met een nieuwe quiz!',
      {
        date: scheduledTime,
        repeats: true,
      },
      {
        type: NOTIFICATION_TYPES.QUIZ_REMINDER,
      }
    );
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  const getScheduledNotifications = async () => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  return {
    expoPushToken,
    notification,
    requestPermissions,
    scheduleLocalNotification,
    scheduleWordOfDayNotification,
    scheduleStreakReminder,
    scheduleQuizReminder,
    cancelAllNotifications,
    getScheduledNotifications,
  };
}
