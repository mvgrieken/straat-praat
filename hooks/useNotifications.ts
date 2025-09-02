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
  const { settings } = useSettings();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('Push token registered successfully:', token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
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

  const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      try {
        // Check if we have the required permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token for push notification!');
          return;
        }

        // Get the token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          console.warn('No project ID found in app config');
          return;
        }

        token = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        
        console.log('Push token generated:', token.data);
      } catch (error) {
        console.error('Error getting push token:', error);
        
        // Handle VAPID public key error specifically
        if (error instanceof Error && error.message.includes('vapidPublicKey')) {
          console.warn('VAPID public key not configured for web push notifications');
          // Don't throw the error, just log it and continue
          return;
        }
        
        // For other errors, we might want to handle them differently
        console.error('Unexpected error during push token registration:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token?.data;
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    switch (data?.type) {
      case NOTIFICATION_TYPES.WORD_OF_DAY:
        // Navigate to word of the day
        console.log('Navigate to word of the day');
        break;
      case NOTIFICATION_TYPES.QUIZ_REMINDER:
        // Navigate to quiz
        console.log('Navigate to quiz');
        break;
      case NOTIFICATION_TYPES.STREAK_REMINDER:
        // Navigate to profile
        console.log('Navigate to profile');
        break;
      case NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED:
        // Navigate to achievements
        console.log('Navigate to achievements');
        break;
      case NOTIFICATION_TYPES.COMMUNITY_UPDATE:
        // Navigate to community
        console.log('Navigate to community');
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  };

  const sendLocalNotification = async (notificationData: NotificationData) => {
    if (!settings.notificationsEnabled) {
      console.log('Notifications disabled in settings');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  const scheduleNotification = async (
    notificationData: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ) => {
    if (!settings.notificationsEnabled) {
      console.log('Notifications disabled in settings');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
        },
        trigger,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  };

  const getNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting notification permissions:', error);
      return 'denied';
    }
  };

  return {
    expoPushToken,
    notification,
    sendLocalNotification,
    scheduleNotification,
    cancelAllNotifications,
    getNotificationPermissions,
  };
}
