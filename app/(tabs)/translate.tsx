import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';

import { useSettings } from '@/hooks/useSettings';
import { TranslationResult } from '@/components/TranslationResult';
import { SearchSuggestions } from '@/components/SearchSuggestions';
import { RecentSearches } from '@/components/RecentSearches';
import { COLORS } from '@/constants';

export default function TranslateScreen() {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState<'slang_to_dutch' | 'dutch_to_slang'>('slang_to_dutch');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<TextInput>(null);

  // Search suggestions query
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', query, direction],
    queryFn: async () => {
      if (query.length < 2) return [];
      
      // TODO: Implement actual API call for search suggestions
      const mockSuggestions = [
        'flex',
        'flexing',
        'lit',
        'fire',
        'sus',
        'periodt',
        'no cap',
        'slay',
        'vibe check',
        'bet',
      ].filter(word => 
        word.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      
      return mockSuggestions;
    },
    enabled: query.length >= 2 && showSuggestions,
  });

  // Translation query
  const { data: translationResult, isLoading, error, refetch } = useQuery({
    queryKey: ['translation', query, direction],
    queryFn: async () => {
      if (!query.trim()) return null;
      
      // TODO: Implement actual translation API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      if (direction === 'slang_to_dutch') {
        return {
          original: query,
          translation: 'opscheppen, laten zien',
          example: `Stop met ${query}en met je nieuwe telefoon`,
          audioUrl: null,
          confidence: 0.95,
        };
      } else {
        return {
          original: query,
          translation: 'flex',
          example: 'Stop met flexen met je nieuwe telefoon',
          audioUrl: null,
          confidence: 0.89,
        };
      }
    },
    enabled: false, // Only run when manually triggered
  });

  // Voice recording mutation
  const voiceRecordingMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement voice recording and speech-to-text
      setIsVoiceRecording(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate recording
      setIsVoiceRecording(false);
      return 'Dit is een test van spraakherkenning';
    },
    onSuccess: (transcribedText) => {
      setQuery(transcribedText);
      handleSearch(transcribedText);
    },
    onError: () => {
      setIsVoiceRecording(false);
      Alert.alert('Fout', 'Spraakherkenning is mislukt. Probeer het opnieuw.');
    },
  });

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setShowSuggestions(false);
    inputRef.current?.blur();
    refetch();
  };

  const handleDirectionChange = () => {
    setDirection(prev => 
      prev === 'slang_to_dutch' ? 'dutch_to_slang' : 'slang_to_dutch'
    );
    if (query.trim()) {
      refetch();
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleVoiceRecording = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Niet ondersteund', 'Spraakherkenning is niet beschikbaar op web.');
      return;
    }
    
    voiceRecordingMutation.mutate();
  };

  const clearQuery = () => {
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: isDark ? COLORS.gray[900] : COLORS.gray[50] 
      }}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <Text 
              className="text-2xl font-bold mb-2"
              style={{ 
                color: isDark ? COLORS.white : COLORS.gray[900],
                fontSize: settings.fontSize === 'large' ? 28 : 24,
              }}
            >
              Vertalen
            </Text>
            <Text 
              className="text-base opacity-70"
              style={{ 
                color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                fontSize: settings.fontSize === 'large' ? 18 : 16,
              }}
            >
              Vertaal tussen Straat-Praat en Nederlands
            </Text>
          </View>

          {/* Direction Toggle */}
          <View className="px-6 mb-6">
            <TouchableOpacity
              onPress={handleDirectionChange}
              className="rounded-2xl p-4 shadow-sm flex-row items-center justify-between"
              style={{ 
                backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
                borderWidth: 1,
                borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
              }}
            >
              <Text 
                className="font-medium flex-1"
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 16 : 14,
                }}
              >
                {direction === 'slang_to_dutch' ? 'Straat-Praat → Nederlands' : 'Nederlands → Straat-Praat'}
              </Text>
              
              <View 
                className="rounded-full p-2"
                style={{ backgroundColor: COLORS.primary[100] }}
              >
                <Ionicons 
                  name="swap-horizontal" 
                  size={20} 
                  color={COLORS.primary[600]} 
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="px-6 mb-6">
            <View 
              className="rounded-2xl shadow-sm"
              style={{ 
                backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
                borderWidth: 1,
                borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
              }}
            >
              <View className="flex-row items-center p-4">
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={(text) => {
                    setQuery(text);
                    setShowSuggestions(text.length >= 2);
                  }}
                  onSubmitEditing={() => handleSearch()}
                  placeholder={
                    direction === 'slang_to_dutch' 
                      ? 'Voer een slangwoord in...' 
                      : 'Voer een Nederlands woord in...'
                  }
                  placeholderTextColor={isDark ? COLORS.gray[500] : COLORS.gray[400]}
                  className="flex-1 mr-3"
                  style={{ 
                    color: isDark ? COLORS.white : COLORS.gray[900],
                    fontSize: settings.fontSize === 'large' ? 18 : 16,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                {query.length > 0 && (
                  <TouchableOpacity onPress={clearQuery} className="mr-3">
                    <Ionicons 
                      name="close-circle" 
                      size={20} 
                      color={isDark ? COLORS.gray[500] : COLORS.gray[400]} 
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleVoiceRecording}
                  disabled={isVoiceRecording || voiceRecordingMutation.isPending}
                  className="mr-3"
                >
                  <Ionicons 
                    name={isVoiceRecording ? "radio-button-on" : "mic-outline"} 
                    size={24} 
                    color={
                      isVoiceRecording || voiceRecordingMutation.isPending
                        ? COLORS.error[500]
                        : COLORS.primary[500]
                    } 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSearch()}
                  disabled={!query.trim() || isLoading}
                  className="rounded-xl p-2"
                  style={{ 
                    backgroundColor: query.trim() ? COLORS.primary[500] : COLORS.gray[300] 
                  }}
                >
                  <Ionicons 
                    name="search" 
                    size={20} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Search Suggestions */}
          {showSuggestions && suggestions && suggestions.length > 0 && (
            <View className="px-6 mb-6">
              <SearchSuggestions 
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
              />
            </View>
          )}

          {/* Translation Result */}
          {translationResult && (
            <View className="px-6 mb-6">
              <TranslationResult 
                result={translationResult}
                isLoading={isLoading}
                direction={direction}
              />
            </View>
          )}

          {/* Error State */}
          {error && (
            <View className="px-6 mb-6">
              <View 
                className="rounded-2xl p-6 shadow-sm"
                style={{ 
                  backgroundColor: COLORS.error[50],
                  borderWidth: 1,
                  borderColor: COLORS.error[200],
                }}
              >
                <View className="flex-row items-center mb-3">
                  <Ionicons 
                    name="alert-circle" 
                    size={24} 
                    color={COLORS.error[500]} 
                  />
                  <Text 
                    className="font-semibold ml-2"
                    style={{ 
                      color: COLORS.error[700],
                      fontSize: settings.fontSize === 'large' ? 18 : 16,
                    }}
                  >
                    Vertaling mislukt
                  </Text>
                </View>
                <Text 
                  className="mb-4"
                  style={{ 
                    color: COLORS.error[600],
                    fontSize: settings.fontSize === 'large' ? 16 : 14,
                  }}
                >
                  Er is een fout opgetreden bij het vertalen. Controleer je internetverbinding en probeer het opnieuw.
                </Text>
                <TouchableOpacity 
                  onPress={() => refetch()}
                  className="self-start rounded-lg px-4 py-2"
                  style={{ backgroundColor: COLORS.error[500] }}
                >
                  <Text className="text-white font-medium">Probeer opnieuw</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Recent Searches */}
          {!query && !translationResult && !error && (
            <View className="px-6 mb-8">
              <RecentSearches onSelect={handleSuggestionSelect} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}