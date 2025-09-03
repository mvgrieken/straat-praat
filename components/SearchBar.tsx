import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  Pressable,
} from 'react-native';

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { WordService, WordSearchResult } from '@/services/wordService.simple';

interface SearchBarProps {
  onWordSelect?: (result: WordSearchResult) => void;
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar = React.memo(({ 
  onWordSelect, 
  onSearchChange,
  placeholder = "Zoek een slangwoord...",
  autoFocus = false 
}: SearchBarProps) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search-words', debouncedQuery],
    queryFn: () => WordService.searchWords(debouncedQuery, 8),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Memoized styles for performance
  const searchBarStyles = useMemo(() => ({
    backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
    borderWidth: 1,
    borderColor: isDark ? COLORS.gray[700] : COLORS.gray[300],
  }), [isDark]);

  const resultsContainerStyles = useMemo(() => ({
    backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
    borderWidth: 1,
    borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
  }), [isDark]);

  // Memoized handlers
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setShowResults(text.length >= 2);
    onSearchChange?.(text);
  }, [onSearchChange]);

  const handleWordSelect = useCallback((result: WordSearchResult) => {
    setSearchQuery(result.slang_word);
    setShowResults(false);
    
    // Track word view
    if (user) {
      WordService.trackWordView(user.id, result.word_id);
    }
    
    onWordSelect?.(result);
  }, [user, onWordSelect]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowResults(false);
    onSearchChange?.('');
  }, [onSearchChange]);

  const handleFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowResults(true);
    }
  }, [searchQuery.length]);

  // Memoized render functions
  const renderSearchResult = useCallback(({ item }: { item: WordSearchResult }) => (
    <Pressable
      onPress={() => handleWordSelect(item)}
      className="p-4 border-b border-gray-200"
      style={{
        backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
        borderBottomColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text 
            className="font-semibold text-lg"
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 20 : 18 
            }}
          >
            {item.slang_word}
          </Text>
          <Text 
            className="text-gray-600 mt-1"
            style={{ 
              color: isDark ? COLORS.gray[400] : COLORS.gray[600],
              fontSize: settings.fontSize === 'large' ? 16 : 14 
            }}
          >
            {item.dutch_meaning}
          </Text>
          {item.example_sentence && (
            <Text 
              className="text-gray-500 mt-1 italic"
              style={{ 
                color: isDark ? COLORS.gray[500] : COLORS.gray[500],
                fontSize: settings.fontSize === 'large' ? 14 : 12 
              }}
            >
              "{item.example_sentence}"
            </Text>
          )}
        </View>
        <View className="ml-3 flex-row items-center">
          {item.match_type !== 'exact' && (
            <View className="bg-blue-100 rounded-full px-2 py-1 mr-2">
              <Text className="text-blue-700 text-xs font-medium">
                {getMatchTypeLabel(item.match_type)}
              </Text>
            </View>
          )}
          {item.audio_url && (
            <Ionicons name="volume-high-outline" size={16} color={COLORS.gray[500]} />
          )}
        </View>
      </View>
    </Pressable>
  ), [isDark, settings.fontSize, handleWordSelect]);

  // Helper function for match type labels
  const getMatchTypeLabel = useCallback((matchType: string) => {
    const labels: Record<string, string> = {
      phonetic: '🔊',
      fuzzy: '~',
      variant: 'var'
    };
    return labels[matchType] || '';
  }, []);

  return (
    <View className="relative">
      <View 
        className="flex-row items-center rounded-2xl px-4 py-3 shadow-sm"
        style={searchBarStyles}
      >
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
          style={{ marginRight: 12 }}
        />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={placeholder}
          placeholderTextColor={isDark ? COLORS.gray[500] : COLORS.gray[400]}
          autoFocus={autoFocus}
          className="flex-1"
          style={{
            color: isDark ? COLORS.white : COLORS.gray[900],
            fontSize: settings.fontSize === 'large' ? 18 : 16,
          }}
          onFocus={handleFocus}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} className="ml-2">
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
            />
          </TouchableOpacity>
        )}
      </View>

      {showResults && (
        <View 
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-lg z-10 max-h-80"
          style={resultsContainerStyles}
        >
          {isLoading ? (
            <View className="p-4">
              <Text className="text-center text-gray-500">Zoeken...</Text>
            </View>
          ) : !searchResults || searchResults.length === 0 ? (
            <View className="p-4">
              <Text 
                className="text-center"
                style={{ color: isDark ? COLORS.gray[400] : COLORS.gray[600] }}
              >
                Geen resultaten voor &ldquo;{debouncedQuery}&rdquo;
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.word_id}
              renderItem={renderSearchResult}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}
        </View>
      )}
    </View>
  );
});

SearchBar.displayName = 'SearchBar';