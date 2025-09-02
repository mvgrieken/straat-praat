import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Platform } from 'react-native';

import { COLORS, STORAGE_KEYS } from '@/constants';
import { useSettings } from '@/hooks/useSettings';

interface RecentSearchesProps {
  onSelect: (search: string) => void;
}

export function RecentSearches({ onSelect }: RecentSearchesProps) {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const storage = Platform.OS === 'web' ? 
        { getItem: (key: string) => Promise.resolve(localStorage.getItem(key)) } :
        AsyncStorage;
      
      const stored = await storage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      if (stored) {
        const searches = JSON.parse(stored) as string[];
        setRecentSearches(searches.slice(0, 5)); // Last 5 searches
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      const storage = Platform.OS === 'web' ? 
        { removeItem: (key: string) => { localStorage.removeItem(key); return Promise.resolve(); } } :
        AsyncStorage;
      
      await storage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  if (recentSearches.length === 0) {
    return (
      <View 
        style={{ 
          backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
        }}
      >
        <Ionicons 
          name="time-outline" 
          size={48} 
          color={isDark ? COLORS.gray[600] : COLORS.gray[400]} 
        />
        <Text 
          style={{ 
            color: isDark ? COLORS.gray[300] : COLORS.gray[600],
            fontSize: settings.fontSize === 'large' ? 18 : 16,
            fontWeight: '600',
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Geen recente zoekopdrachten
        </Text>
        <Text 
          style={{ 
            color: isDark ? COLORS.gray[400] : COLORS.gray[500],
            fontSize: settings.fontSize === 'large' ? 16 : 14,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Je zoekopdrachten verschijnen hier
        </Text>
      </View>
    );
  }

  return (
    <View 
      style={{ 
        backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
      }}
    >
      <View
        style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12,
      }}
      >
        <Text 
          style={{ 
            color: isDark ? COLORS.gray[300] : COLORS.gray[600],
            fontSize: settings.fontSize === 'large' ? 16 : 14,
            fontWeight: '600',
          }}
        >
          Recente zoekopdrachten
        </Text>
        
        <TouchableOpacity 
          onPress={clearRecentSearches}
          style={{
            padding: 4,
          }}
        >
          <Ionicons 
            name="trash-outline" 
            size={18} 
            color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={`${search}-${index}`}
            onPress={() => onSelect(search)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 8,
              borderRadius: 8,
              marginBottom: 4,
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="time-outline" 
              size={18} 
              color={isDark ? COLORS.gray[400] : COLORS.gray[500]}
              style={{ marginRight: 12 }}
            />
            <Text 
              style={{ 
                color: isDark ? COLORS.white : COLORS.gray[900],
                fontSize: settings.fontSize === 'large' ? 16 : 14,
                flex: 1,
              }}
            >
              {search}
            </Text>
            <Ionicons 
              name="arrow-up-outline" 
              size={16} 
              color={isDark ? COLORS.gray[500] : COLORS.gray[400]}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}