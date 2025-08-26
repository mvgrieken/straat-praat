import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '@/hooks/useSettings';
import { COLORS } from '@/constants';

interface SearchSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SearchSuggestions({ suggestions, onSelect }: SearchSuggestionsProps) {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View 
      style={{ 
        backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
      }}
    >
      <Text 
        style={{ 
          color: isDark ? COLORS.gray[300] : COLORS.gray[600],
          fontSize: settings.fontSize === 'large' ? 16 : 14,
          fontWeight: '600',
          marginBottom: 12,
        }}
      >
        Suggesties
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={`${suggestion}-${index}`}
            onPress={() => onSelect(suggestion)}
            style={{
              backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[100],
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              minWidth: 80,
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="search-outline" 
              size={16} 
              color={isDark ? COLORS.gray[400] : COLORS.gray[500]}
              style={{ marginRight: 6 }}
            />
            <Text 
              style={{ 
                color: isDark ? COLORS.white : COLORS.gray[900],
                fontSize: settings.fontSize === 'large' ? 16 : 14,
                fontWeight: '500',
              }}
            >
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}