import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
// LinearGradient can be used for enhanced UI in future versions

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';

export function StreakCard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  
  const currentStreak = user?.currentStreak || 0;
  const longestStreak = user?.longestStreak || 0;

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return 'Begin je leerreis!';
    }
    if (currentStreak === 1) {
      return 'Goed bezig!';
    }
    if (currentStreak < 7) {
      return 'Je bent op de goede weg!';
    }
    if (currentStreak < 30) {
      return 'Indrukwekkende reeks!';
    }
    return 'Ongelooflijk volgehouden!';
  };

  const getStreakColor = () => {
    if (currentStreak === 0) return COLORS.gray[400];
    if (currentStreak < 7) return COLORS.warning[500];
    if (currentStreak < 30) return COLORS.primary[500];
    return COLORS.success[500];
  };

  const getStreakIcon = () => {
    if (currentStreak === 0) return 'flame-outline';
    return 'flame';
  };

  return (
    <View 
      className="rounded-2xl p-5 shadow-sm"
      style={{ 
        backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
        borderWidth: 1,
        borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text 
            className="font-semibold mb-1"
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 18 : 16,
            }}
          >
            Dagelijkse Reeks
          </Text>
          <Text 
            className="opacity-70"
            style={{ 
              color: isDark ? COLORS.gray[300] : COLORS.gray[600],
              fontSize: settings.fontSize === 'large' ? 16 : 14,
            }}
          >
            {getStreakMessage()}
          </Text>
        </View>
        
        <View 
          className="rounded-full p-3"
          style={{ backgroundColor: `${getStreakColor()}20` }}
        >
          <Ionicons 
            name={getStreakIcon()} 
            size={24} 
            color={getStreakColor()} 
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-baseline">
            <Text 
              className="font-bold mr-2"
              style={{ 
                color: getStreakColor(),
                fontSize: settings.fontSize === 'large' ? 36 : 32,
              }}
            >
              {currentStreak}
            </Text>
            <Text 
              className="opacity-70"
              style={{ 
                color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                fontSize: settings.fontSize === 'large' ? 16 : 14,
              }}
            >
              dagen
            </Text>
          </View>
          
          {longestStreak > 0 && (
            <Text 
              className="opacity-60 mt-1"
              style={{ 
                color: isDark ? COLORS.gray[400] : COLORS.gray[500],
                fontSize: settings.fontSize === 'large' ? 14 : 12,
              }}
            >
              Langste reeks: {longestStreak} dagen
            </Text>
          )}
        </View>

        {currentStreak > 0 && (
          <View className="items-center">
            <TouchableOpacity 
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: `${getStreakColor()}10` }}
            >
              <Text 
                className="font-medium"
                style={{ 
                  color: getStreakColor(),
                  fontSize: settings.fontSize === 'large' ? 14 : 12,
                }}
              >
                Deel je reeks
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Streak progress indicator */}
      <View className="mt-4">
        <View 
          className="h-2 rounded-full"
          style={{ backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[200] }}
        >
          <View 
            className="h-2 rounded-full"
            style={{ 
              backgroundColor: getStreakColor(),
              width: `${Math.min((currentStreak / 30) * 100, 100)}%`,
            }}
          />
        </View>
        <Text 
          className="text-center mt-2 opacity-60"
          style={{ 
            color: isDark ? COLORS.gray[400] : COLORS.gray[500],
            fontSize: settings.fontSize === 'large' ? 12 : 10,
          }}
        >
          {currentStreak < 30 
            ? `${30 - currentStreak} dagen tot volgende niveau`
            : 'Maximaal niveau bereikt! 🎉'
          }
        </Text>
      </View>
    </View>
  );
}

