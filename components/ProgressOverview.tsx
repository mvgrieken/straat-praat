import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { COLORS, LEVELS } from '@/constants';

export function ProgressOverview() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  // Fetch user statistics
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      // TODO: Implement actual API call
      return {
        wordsLearned: 45,
        quizzesCompleted: 12,
        averageScore: 82,
        timeSpent: 145, // in minutes
      };
    },
    enabled: !!user,
  });

  if (!user || !stats) {
    return null;
  }

  const getCurrentLevel = () => {
    const totalPoints = user.totalPoints;
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
    : ((user.totalPoints - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

  const statisticCards = [
    {
      id: 'words',
      icon: 'book-outline' as const,
      value: stats.wordsLearned,
      label: 'Woorden geleerd',
      color: COLORS.primary[500],
    },
    {
      id: 'quizzes',
      icon: 'game-controller-outline' as const,
      value: stats.quizzesCompleted,
      label: 'Quizzen voltooid',
      color: COLORS.secondary[500],
    },
    {
      id: 'score',
      icon: 'trophy-outline' as const,
      value: `${stats.averageScore}%`,
      label: 'Gemiddelde score',
      color: COLORS.warning[500],
    },
    {
      id: 'time',
      icon: 'time-outline' as const,
      value: `${Math.floor(stats.timeSpent / 60)}h`,
      label: 'Tijd besteed',
      color: COLORS.success[500],
    },
  ];

  return (
    <View>
      <Text 
        className="font-semibold mb-4"
        style={{ 
          color: isDark ? COLORS.white : COLORS.gray[900],
          fontSize: settings.fontSize === 'large' ? 20 : 18,
        }}
      >
        Je voortgang
      </Text>

      {/* Level Progress */}
      <View 
        className="rounded-2xl p-5 mb-4 shadow-sm"
        style={{ 
          backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
          borderWidth: 1,
          borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text 
              className="text-2xl mr-2"
              style={{ fontSize: settings.fontSize === 'large' ? 28 : 24 }}
            >
              {currentLevel.icon}
            </Text>
            <View>
              <Text 
                className="font-bold"
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 18 : 16,
                }}
              >
                {currentLevel.name}
              </Text>
              <Text 
                className="opacity-70"
                style={{ 
                  color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                  fontSize: settings.fontSize === 'large' ? 14 : 12,
                }}
              >
                {user.totalPoints} punten
              </Text>
            </View>
          </View>
          
          <Text 
            className="font-bold"
            style={{ 
              color: COLORS.primary[500],
              fontSize: settings.fontSize === 'large' ? 20 : 18,
            }}
          >
            Lvl {user.level}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="mb-2">
          <View 
            className="h-3 rounded-full"
            style={{ backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[200] }}
          >
            <View 
              className="h-3 rounded-full"
              style={{ 
                backgroundColor: COLORS.primary[500],
                width: `${progressToNext}%`,
              }}
            />
          </View>
        </View>
        
        <Text 
          className="text-center opacity-60"
          style={{ 
            color: isDark ? COLORS.gray[400] : COLORS.gray[500],
            fontSize: settings.fontSize === 'large' ? 12 : 10,
          }}
        >
          {currentLevel.key === 'MASTER'
            ? 'Maximaal niveau bereikt!'
            : `${currentLevel.max - user.totalPoints} punten tot volgend niveau`
          }
        </Text>
      </View>

      {/* Statistics Grid */}
      <View className="flex-row flex-wrap justify-between">
        {statisticCards.map((stat, index) => (
          <View 
            key={stat.id}
            className="w-[48%] rounded-xl p-4 mb-3 shadow-sm"
            style={{ 
              backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
              borderWidth: 1,
              borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
              marginRight: index % 2 === 0 ? 8 : 0,
              marginLeft: index % 2 === 1 ? 8 : 0,
            }}
          >
            <View 
              className="rounded-lg p-2 self-start mb-2"
              style={{ backgroundColor: `${stat.color}20` }}
            >
              <Ionicons name={stat.icon} size={20} color={stat.color} />
            </View>
            
            <Text 
              className="font-bold mb-1"
              style={{ 
                color: isDark ? COLORS.white : COLORS.gray[900],
                fontSize: settings.fontSize === 'large' ? 20 : 18,
              }}
            >
              {stat.value}
            </Text>
            
            <Text 
              className="opacity-70"
              style={{ 
                color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                fontSize: settings.fontSize === 'large' ? 14 : 12,
              }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}