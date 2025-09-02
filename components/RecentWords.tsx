import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { SlangWord } from '@/types';

export function RecentWords() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  // Fetch recently learned words
  const { data: recentWords } = useQuery({
    queryKey: ['recent-words', user?.id],
    queryFn: async (): Promise<SlangWord[]> => {
      // TODO: Implement actual API call
      return [
        {
          id: '1',
          word: 'flex',
          meaning: 'opscheppen, laten zien',
          example: 'Stop met flexen met je nieuwe telefoon',
          audioUrl: null,
          difficulty: 'easy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          word: 'sus',
          meaning: 'verdacht, niet te vertrouwen',
          example: 'Dat verhaal klinkt wel sus',
          audioUrl: null,
          difficulty: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          word: 'periodt',
          meaning: 'punt uit, einde discussie',
          example: 'Ik ga niet, periodt!',
          audioUrl: null,
          difficulty: 'hard',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    },
    enabled: !!user,
  });

  if (!recentWords || recentWords.length === 0) {
    return (
      <View>
        <Text 
          className="font-semibold mb-4"
          style={{ 
            color: isDark ? COLORS.white : COLORS.gray[900],
            fontSize: settings.fontSize === 'large' ? 20 : 18,
          }}
        >
          Recente woorden
        </Text>
        
        <View 
          className="rounded-2xl p-6 shadow-sm items-center"
          style={{ 
            backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
            borderWidth: 1,
            borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
          }}
        >
          <Ionicons 
            name="book-outline" 
            size={48} 
            color={isDark ? COLORS.gray[600] : COLORS.gray[400]} 
          />
          <Text 
            className="text-center mt-3 mb-4 opacity-70"
            style={{ 
              color: isDark ? COLORS.gray[300] : COLORS.gray[600],
              fontSize: settings.fontSize === 'large' ? 16 : 14,
            }}
          >
            Je hebt nog geen woorden bekeken. Start met &ldquo;zoeken&rdquo; of &ldquo;vertalen&rdquo;!
          </Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/translate')}
            className="rounded-lg px-4 py-2"
            style={{ backgroundColor: COLORS.primary[500] }}
          >
            <Text 
              className="text-white font-medium"
              style={{ fontSize: settings.fontSize === 'large' ? 16 : 14 }}
            >
              Begin met leren
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return COLORS.success[500];
      case 'medium':
        return COLORS.warning[500];
      case 'hard':
        return COLORS.error[500];
      default:
        return COLORS.gray[500];
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Makkelijk';
      case 'medium':
        return 'Gemiddeld';
      case 'hard':
        return 'Moeilijk';
      default:
        return 'Onbekend';
    }
  };

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text 
          className="font-semibold"
          style={{ 
            color: isDark ? COLORS.white : COLORS.gray[900],
            fontSize: settings.fontSize === 'large' ? 20 : 18,
          }}
        >
          Recente woorden
        </Text>
        
        <TouchableOpacity onPress={() => router.push('/profile?tab=history')}>
          <Text 
            className="font-medium"
            style={{ 
              color: COLORS.primary[500],
              fontSize: settings.fontSize === 'large' ? 16 : 14,
            }}
          >
            Alles bekijken
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 24 }}
      >
        {recentWords.map((word) => (
          <TouchableOpacity
            key={word.id}
            onPress={() => router.push(`/word/${word.id}` as any)}
            className="rounded-xl p-4 mr-4 shadow-sm"
            style={{ 
              backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
              borderWidth: 1,
              borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
              width: 280,
              minHeight: 120,
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text 
                  className="font-bold mb-1"
                  style={{ 
                    color: isDark ? COLORS.white : COLORS.gray[900],
                    fontSize: settings.fontSize === 'large' ? 20 : 18,
                  }}
                >
                  {word.word}
                </Text>
                
                <Text 
                  className="opacity-80"
                  style={{ 
                    color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                    fontSize: settings.fontSize === 'large' ? 16 : 14,
                  }}
                >
                  {word.meaning}
                </Text>
              </View>
              
              <View 
                className="rounded-full px-2 py-1"
                style={{ backgroundColor: `${getDifficultyColor(word.difficulty)}20` }}
              >
                <Text 
                  className="font-medium"
                  style={{ 
                    color: getDifficultyColor(word.difficulty),
                    fontSize: settings.fontSize === 'large' ? 12 : 10,
                  }}
                >
                  {getDifficultyLabel(word.difficulty)}
                </Text>
              </View>
            </View>

            {word.example && (
              <View 
                className="rounded-lg p-3"
                style={{ backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[100] }}
              >
                <Text 
                  className="italic opacity-80"
                  style={{ 
                    color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                    fontSize: settings.fontSize === 'large' ? 14 : 12,
                  }}
                >
                  "{word.example}"
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between mt-3">
              {word.audioUrl && (
                <View className="flex-row items-center">
                  <Ionicons 
                    name="volume-medium-outline" 
                    size={16} 
                    color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
                  />
                  <Text 
                    className="ml-1 opacity-60"
                    style={{ 
                      color: isDark ? COLORS.gray[400] : COLORS.gray[500],
                      fontSize: settings.fontSize === 'large' ? 12 : 10,
                    }}
                  >
                    Audio beschikbaar
                  </Text>
                </View>
              )}
              
              <Ionicons 
                name="chevron-forward-outline" 
                size={16} 
                color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}