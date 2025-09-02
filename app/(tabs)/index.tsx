import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { COLORS } from '@/constants';
import { WordOfTheDayCard } from '@/components/WordOfTheDayCard';
import { StreakCard } from '@/components/StreakCard';
import { QuickActionCard } from '@/components/QuickActionCard';
import { ProgressOverview } from '@/components/ProgressOverview';
import { RecentWords } from '@/components/RecentWords';

export default function HomeScreen() {
  const { user } = useAuth();
  const { settings } = useSettings();
  
  const isDark = settings.theme === 'dark';
  
  // Fetch word of the day (not used directly since WordOfTheDayCard fetches its own data)
  const { refetch, isRefetching } = useQuery({
    queryKey: ['word-of-day'],
    queryFn: async () => {
      // TODO: Implement actual API call
      return {
        id: '1',
        word: 'lit',
        meaning: 'geweldig, fantastisch',
        example: 'Die nieuwe sneakers zijn echt lit!',
        audioUrl: null,
        difficulty: 'easy' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleWordPress = (wordId: string) => {
    // Navigate to word detail or show in modal
    router.push(`/word/${wordId}`);
  };

  const handleTranslatePress = () => router.push('/translate');
  const handleQuizPress = () => router.push('/quiz');
  const handleFavoritesPress = () => router.push('/profile?tab=favorites');
  const handleAchievementsPress = () => router.push('/profile?tab=achievements');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  const quickActions = [
    {
      id: 'translate',
      title: 'Vertalen',
      icon: 'language-outline' as const,
      color: COLORS.primary[500],
      onPress: handleTranslatePress,
    },
    {
      id: 'quiz',
      title: 'Quiz',
      icon: 'game-controller-outline' as const,
      color: COLORS.secondary[500],
      onPress: handleQuizPress,
    },
    {
      id: 'favorites',
      title: 'Favorieten',
      icon: 'heart-outline' as const,
      color: COLORS.error[500],
      onPress: handleFavoritesPress,
    },
    {
      id: 'achievements',
      title: 'Prestaties',
      icon: 'trophy-outline' as const,
      color: COLORS.warning[500],
      onPress: handleAchievementsPress,
    },
  ];

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: isDark ? COLORS.gray[900] : COLORS.gray[50] 
      }}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[COLORS.primary[500]]}
            tintColor={COLORS.primary[500]}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 28 : 24,
            }}
          >
            {getGreeting()}{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
          </Text>
          <Text 
            className="text-base opacity-70"
            style={{ 
              color: isDark ? COLORS.gray[300] : COLORS.gray[600],
              fontSize: settings.fontSize === 'large' ? 18 : 16,
            }}
          >
            Welkom bij Straat-Praat
          </Text>
        </View>

        {/* Word of the Day */}
        <View className="px-6 mb-6">
          <WordOfTheDayCard
            onWordPress={handleWordPress}
          />
        </View>

        {/* Streak Card */}
        <View className="px-6 mb-6">
          <StreakCard />
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text 
            className="text-lg font-semibold mb-4"
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 20 : 18,
            }}
          >
            Snelle acties
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <View 
                key={action.id} 
                className="w-[48%] mb-3"
                style={{ 
                  marginRight: index % 2 === 0 ? 8 : 0,
                  marginLeft: index % 2 === 1 ? 8 : 0,
                }}
              >
                <QuickActionCard {...action} />
              </View>
            ))}
          </View>
        </View>

        {/* Progress Overview */}
        <View className="px-6 mb-6">
          <ProgressOverview />
        </View>

        {/* Recent Words */}
        <View className="px-6 mb-8">
          <RecentWords />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}