import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, LEVELS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { settings, notificationSettings, updateSettings, updateNotificationSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [showMFA, setShowMFA] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const isDark = settings.theme === 'dark';
  
  const getCurrentLevel = () => {
    if (!user) return { key: 'BRONZE', ...LEVELS.BRONZE };
    
    const totalPoints = user.totalPoints ?? 0;
    for (const [key, level] of Object.entries(LEVELS)) {
      if (totalPoints >= level.min && totalPoints <= level.max) {
        return { key, ...level };
      }
    }
    return { key: 'MASTER', ...LEVELS.MASTER };
  };

  const currentLevel = getCurrentLevel();
  const progressToNext = currentLevel.key === 'MASTER' 
    ? 100 
    : user ? ((user.totalPoints ?? 0 - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100 : 0;

  const handleLoginPress = () => router.push('/auth/login');
  const handleTabChange = (tab: string) => setActiveTab(tab);
  const handleSignOut = () => {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        { 
          text: 'Uitloggen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login' as any);
            } catch (error) {
              Alert.alert('Fout', 'Er is iets misgegaan bij het uitloggen.');
            }
          }
        },
      ]
    );
  };
  const handleMFAEnable = () => setShowMFA(true);
  const handleBackupCodes = () => setShowBackupCodes(true);
  const handleCloseMFA = () => setShowMFA(false);
  const handleCloseBackupCodes = () => setShowBackupCodes(false);

  if (!user) {
    return (
      <SafeAreaView 
        style={{ 
          flex: 1, 
          backgroundColor: isDark ? COLORS.gray[900] : COLORS.gray[50],
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Ionicons 
          name="person-outline" 
          size={64} 
          color={isDark ? COLORS.gray[600] : COLORS.gray[400]} 
        />
        <Text 
          style={{ 
            color: isDark ? COLORS.white : COLORS.gray[900],
            fontSize: settings.fontSize === 'large' ? 24 : 20,
            fontWeight: 'bold',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Niet ingelogd
        </Text>
        <Text 
          style={{ 
            color: isDark ? COLORS.gray[300] : COLORS.gray[600],
            fontSize: settings.fontSize === 'large' ? 18 : 16,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          Log in om je profiel en voortgang te bekijken
        </Text>
        
        <TouchableOpacity
          onPress={() => router.push('/auth/login' as any)}
          style={{
            backgroundColor: COLORS.primary[500],
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text 
            style={{ 
              color: 'white',
              fontSize: settings.fontSize === 'large' ? 18 : 16,
              fontWeight: '600',
            }}
          >
            Inloggen
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: isDark ? COLORS.gray[900] : COLORS.gray[50] 
      }}
    >
      <ScrollView>
        {/* Header */}
        <View style={{ padding: 24, paddingBottom: 16 }}>
          <Text 
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 28 : 24,
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            Profiel
          </Text>
          <Text 
            style={{ 
              color: isDark ? COLORS.gray[300] : COLORS.gray[600],
              fontSize: settings.fontSize === 'large' ? 18 : 16,
            }}
          >
            Beheer je account en instellingen
          </Text>
        </View>

        {/* User Info Card */}
        <View 
          style={{
            marginHorizontal: 24,
            marginBottom: 24,
            backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View 
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: COLORS.primary[500],
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 36, color: 'white' }}>
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            
            <Text 
              style={{ 
                color: isDark ? COLORS.white : COLORS.gray[900],
                fontSize: settings.fontSize === 'large' ? 20 : 18,
                fontWeight: '600',
                marginBottom: 4,
              }}
            >
              {user.displayName || 'Gebruiker'}
            </Text>
            
            <Text 
              style={{ 
                color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                fontSize: settings.fontSize === 'large' ? 16 : 14,
              }}
            >
              {user.email}
            </Text>
          </View>

          {/* Level Progress */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>{currentLevel.icon}</Text>
              <Text 
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 18 : 16,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                {currentLevel.name} (Level {user.level})
              </Text>
              <Text 
                style={{ 
                  color: COLORS.primary[500],
                  fontSize: settings.fontSize === 'large' ? 16 : 14,
                  fontWeight: '600',
                }}
              >
                {user.totalPoints} punten
              </Text>
            </View>
            
            <View 
              style={{
                height: 8,
                backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View 
                style={{
                  height: '100%',
                  backgroundColor: COLORS.primary[500],
                  width: `${progressToNext}%`,
                }}
              />
            </View>
            
            <Text 
              style={{ 
                color: isDark ? COLORS.gray[400] : COLORS.gray[500],
                fontSize: settings.fontSize === 'large' ? 14 : 12,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {currentLevel.key === 'MASTER'
                ? 'Maximaal niveau bereikt!'
                : `${currentLevel.max - (user.totalPoints ?? 0)} punten tot volgend niveau`
              }
            </Text>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text 
                style={{ 
                  color: COLORS.success[500],
                  fontSize: settings.fontSize === 'large' ? 24 : 20,
                  fontWeight: 'bold',
                }}
              >
                {user.currentStreak}
              </Text>
              <Text 
                style={{ 
                  color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                  fontSize: settings.fontSize === 'large' ? 14 : 12,
                }}
              >
                Huidige streak
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text 
                style={{ 
                  color: COLORS.warning[500],
                  fontSize: settings.fontSize === 'large' ? 24 : 20,
                  fontWeight: 'bold',
                }}
              >
                {user.longestStreak}
              </Text>
              <Text 
                style={{ 
                  color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                  fontSize: settings.fontSize === 'large' ? 14 : 12,
                }}
              >
                Langste streak
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        
        {/* App Settings */}
        <View 
          style={{
            marginHorizontal: 24,
            marginBottom: 16,
            backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
          }}
        >
          <Text 
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 18 : 16,
              fontWeight: '600',
              padding: 16,
              paddingBottom: 8,
            }}
          >
            App Instellingen
          </Text>
          
          <View style={{ paddingHorizontal: 16 }}>
            {/* Theme Setting */}
            <View
              style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
            }}
            >
              <Ionicons 
                name="moon-outline" 
                size={20} 
                color={isDark ? COLORS.gray[300] : COLORS.gray[600]} 
              />
              <Text 
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 16 : 14,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Donkere modus
              </Text>
              <Switch
                value={settings.theme === 'dark'}
                onValueChange={(value) => 
                  updateSettings({ theme: value ? 'dark' : 'light' })
                }
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[500] }}
                thumbColor={settings.theme === 'dark' ? 'white' : COLORS.gray[100]}
              />
            </View>
            
            {/* Font Size */}
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
              }}
              onPress={() => {
                const sizes: ('small' | 'normal' | 'large' | 'extra_large')[] = ['small', 'normal', 'large', 'extra_large'];
                const currentIndex = sizes.indexOf(settings.fontSize);
                const nextIndex = (currentIndex + 1) % sizes.length;
                const newSize = sizes[nextIndex];
                if (newSize) {
                  updateSettings({ fontSize: newSize });
                }
              }}
            >
              <Ionicons 
                name="text-outline" 
                size={20} 
                color={isDark ? COLORS.gray[300] : COLORS.gray[600]} 
              />
              <Text 
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 16 : 14,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Lettergrootte
              </Text>
              <Text 
                style={{ 
                  color: isDark ? COLORS.gray[400] : COLORS.gray[500],
                  fontSize: settings.fontSize === 'large' ? 14 : 12,
                  marginRight: 8,
                }}
              >
                {settings.fontSize === 'small' ? 'Klein' : 
                 settings.fontSize === 'normal' ? 'Normaal' : 
                 settings.fontSize === 'large' ? 'Groot' : 'Extra Groot'}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
              />
            </TouchableOpacity>
            
            {/* Sound */}
            <View
              style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              paddingVertical: 12,
            }}
            >
              <Ionicons 
                name="volume-high-outline" 
                size={20} 
                color={isDark ? COLORS.gray[300] : COLORS.gray[600]} 
              />
              <Text 
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 16 : 14,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Geluid
              </Text>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[500] }}
                thumbColor={settings.soundEnabled ? 'white' : COLORS.gray[100]}
              />
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View 
          style={{
            marginHorizontal: 24,
            marginBottom: 16,
            backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
          }}
        >
          <Text 
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 18 : 16,
              fontWeight: '600',
              padding: 16,
              paddingBottom: 8,
            }}
          >
            Meldingen
          </Text>
          
          <View style={{ paddingHorizontal: 16 }}>
            <View
              style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
            }}
            >
              <Ionicons 
                name="book-outline" 
                size={20} 
                color={isDark ? COLORS.gray[300] : COLORS.gray[600]} 
              />
              <Text 
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 16 : 14,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Woord van de Dag
              </Text>
              <Switch
                value={notificationSettings.dailyWordEnabled}
                onValueChange={(value) => 
                  updateNotificationSettings({ dailyWordEnabled: value })
                }
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[500] }}
                thumbColor={notificationSettings.dailyWordEnabled ? 'white' : COLORS.gray[100]}
              />
            </View>
            
            <View
              style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              paddingVertical: 12,
            }}
            >
              <Ionicons 
                name="trophy-outline" 
                size={20} 
                color={isDark ? COLORS.gray[300] : COLORS.gray[600]} 
              />
              <Text 
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 16 : 14,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Prestaties
              </Text>
              <Switch
                value={notificationSettings.achievementNotificationsEnabled}
                onValueChange={(value) => 
                  updateNotificationSettings({ achievementNotificationsEnabled: value })
                }
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[500] }}
                thumbColor={notificationSettings.achievementNotificationsEnabled ? 'white' : COLORS.gray[100]}
              />
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View 
          style={{
            marginHorizontal: 24,
            marginBottom: 32,
            backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
          }}
        >
          <TouchableOpacity 
            onPress={handleSignOut}
            disabled={loading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <Ionicons 
              name="log-out-outline" 
              size={20} 
              color={COLORS.error[500]} 
            />
            <Text 
              style={{ 
                color: COLORS.error[500],
                fontSize: settings.fontSize === 'large' ? 16 : 14,
                marginLeft: 12,
                fontWeight: '500',
              }}
            >
              {loading ? 'Uitloggen...' : 'Uitloggen'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}