import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

import { COLORS } from '@/constants';
import { useSettings } from '@/hooks/useSettings';

interface QuickActionCardProps {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export function QuickActionCard({ title, icon, color, onPress }: QuickActionCardProps) {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-xl p-4 shadow-sm"
      style={{ 
        backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
        borderWidth: 1,
        borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
        minHeight: 100,
      }}
      activeOpacity={0.7}
    >
      <View className="flex-1 justify-between">
        <View 
          className="rounded-lg p-2 self-start"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={24} color={color} />
        </View>
        
        <Text 
          className="font-semibold mt-3"
          style={{ 
            color: isDark ? COLORS.white : COLORS.gray[900],
            fontSize: settings.fontSize === 'large' ? 16 : 14,
          }}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}