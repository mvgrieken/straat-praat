import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants';
import { useSettings } from '@/hooks/useSettings';

export default function TabsLayout() {
  const { settings } = useSettings();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary[600],
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          backgroundColor: settings.theme === 'dark' ? COLORS.gray[900] : COLORS.white,
          borderTopColor: settings.theme === 'dark' ? COLORS.gray[700] : COLORS.gray[200],
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 88 : 68,
        },
        tabBarLabelStyle: {
          fontSize: settings.fontSize === 'large' ? 14 : 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: settings.theme === 'dark' ? COLORS.gray[900] : COLORS.white,
        },
        headerTintColor: settings.theme === 'dark' ? COLORS.white : COLORS.black,
        headerTitleStyle: {
          fontSize: settings.fontSize === 'large' ? 20 : 18,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="translate"
        options={{
          title: 'Vertalen',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="language-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profiel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}