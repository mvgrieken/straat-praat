import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { NotificationData, NotificationSettings } from '@/types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID,
        })).data;
        this.expoPushToken = token;
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: trigger || null,
    });

    return notificationId;
  }

  async scheduleWordOfTheDayNotification(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check user notification settings
    const { data: settings } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    if (!settings?.notification_settings?.word_of_day) return;

    // Schedule daily notification at 9:00 AM
    await this.scheduleLocalNotification(
      'Woord van de Dag! 🎯',
      'Leer een nieuw slang woord vandaag!',
      { type: 'WORD_OF_DAY' },
      {
        hour: 9,
        minute: 0,
        repeats: true,
      }
    );
  }

  async scheduleQuizReminderNotification(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: settings } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    if (!settings?.notification_settings?.quiz_reminders) return;

    // Schedule quiz reminder every 2 days at 6:00 PM
    await this.scheduleLocalNotification(
      'Quiz Tijd! 🧠',
      'Test je kennis met een nieuwe quiz!',
      { type: 'QUIZ_REMINDER' },
      {
        hour: 18,
        minute: 0,
        repeats: true,
        seconds: 172800, // 2 days
      }
    );
  }

  async scheduleStreakReminderNotification(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: settings } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    if (!settings?.notification_settings?.streak_reminders) return;

    // Schedule streak reminder at 8:00 PM if user hasn't studied today
    await this.scheduleLocalNotification(
      'Streak in Gevaar! 🔥',
      'Behoud je streak door vandaag te studeren!',
      { type: 'STREAK_REMINDER' },
      {
        hour: 20,
        minute: 0,
        repeats: true,
      }
    );
  }

  async sendAchievementNotification(achievementName: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: settings } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    if (!settings?.notification_settings?.achievements) return;

    await this.scheduleLocalNotification(
      'Achievement Unlocked! 🏆',
      `Je hebt "${achievementName}" behaald!`,
      { type: 'ACHIEVEMENT_UNLOCKED', achievementName },
      null // Send immediately
    );
  }

  async sendCommunityUpdateNotification(updateType: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: settings } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    if (!settings?.notification_settings?.community_updates) return;

    const messages = {
      new_word: 'Er is een nieuw woord toegevoegd aan de community!',
      new_quiz: 'Er is een nieuwe quiz beschikbaar!',
      leaderboard: 'De leaderboard is bijgewerkt!',
    };

    await this.scheduleLocalNotification(
      'Community Update! 👥',
      messages[updateType as keyof typeof messages] || 'Er is een community update!',
      { type: 'COMMUNITY_UPDATE', updateType },
      null // Send immediately
    );
  }

  async sendCustomNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    await this.scheduleLocalNotification(title, body, data, null);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ notification_settings: settings })
      .eq('id', user.id);

    // Reschedule notifications based on new settings
    await this.cancelAllNotifications();
    
    if (settings.word_of_day) {
      await this.scheduleWordOfTheDayNotification();
    }
    
    if (settings.quiz_reminders) {
      await this.scheduleQuizReminderNotification();
    }
    
    if (settings.streak_reminders) {
      await this.scheduleStreakReminderNotification();
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', user.id)
      .single();

    return data?.notification_settings || null;
  }

  // Listen for notification interactions
  addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Get current push token
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Send push notification to specific user
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    // Get user's push token from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (!profile?.push_token) return;

    // Send push notification via Expo's push service
    const message = {
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  // Batch send notifications to multiple users
  async sendBatchNotifications(
    userIds: string[],
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (!profiles || profiles.length === 0) return;

    const messages = profiles.map(profile => ({
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  }
}

export default NotificationService.getInstance();
