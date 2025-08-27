import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AITranslator } from '@/components/AITranslator';
import { RecentSearches } from '@/components/RecentSearches';
import { SearchBar } from '@/components/SearchBar';
import { COLORS } from '@/constants';
import { useSettings } from '@/hooks/useSettings';
import { WordService, WordSearchResult } from '@/services/wordService.simple';

export default function TranslateScreen() {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  
  const [selectedWord, setSelectedWord] = useState<WordSearchResult | null>(null);
  const [mode, setMode] = useState<'search' | 'translate'>('search');
  const [direction, setDirection] = useState<'to_formal' | 'to_slang'>('to_formal');

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
              className="text-base opacity-70 mb-4"
              style={{ 
                color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                fontSize: settings.fontSize === 'large' ? 18 : 16,
              }}
            >
              Zoek woorden of vertaal zinnen
            </Text>

            {/* Mode Toggle */}
            <View 
              className="flex-row rounded-2xl p-1"
              style={{ 
                backgroundColor: isDark ? COLORS.gray[800] : COLORS.gray[100],
              }}
            >
              <TouchableOpacity
                onPress={() => setMode('search')}
                className={`flex-1 rounded-xl py-3 px-4 ${mode === 'search' ? 'shadow-sm' : ''}`}
                style={{
                  backgroundColor: mode === 'search' 
                    ? (isDark ? COLORS.white : COLORS.white)
                    : 'transparent'
                }}
              >
                <Text 
                  className="text-center font-medium"
                  style={{ 
                    color: mode === 'search' 
                      ? (isDark ? COLORS.gray[900] : COLORS.gray[900])
                      : (isDark ? COLORS.gray[400] : COLORS.gray[600]),
                  }}
                >
                  Woorden zoeken
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setMode('translate')}
                className={`flex-1 rounded-xl py-3 px-4 ${mode === 'translate' ? 'shadow-sm' : ''}`}
                style={{
                  backgroundColor: mode === 'translate' 
                    ? (isDark ? COLORS.white : COLORS.white)
                    : 'transparent'
                }}
              >
                <Text 
                  className="text-center font-medium"
                  style={{ 
                    color: mode === 'translate' 
                      ? (isDark ? COLORS.gray[900] : COLORS.gray[900])
                      : (isDark ? COLORS.gray[400] : COLORS.gray[600]),
                  }}
                >
                  AI Vertaler
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content based on mode */}
          <View className="px-6 flex-1">
            {mode === 'search' ? (
              <>
                {/* Search Input */}
                <View className="mb-6">
                  <SearchBar
                    onWordSelect={setSelectedWord}
                    placeholder="Zoek een slangwoord..."
                  />
                </View>

                {/* Word Result */}
                {selectedWord && (
                  <View className="mb-6">
                    <View 
                      className="rounded-2xl p-6 shadow-lg"
                      style={{ 
                        backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
                        borderWidth: 1,
                        borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
                      }}
                    >
                      <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-1">
                          <Text 
                            className="text-3xl font-bold mb-2"
                            style={{ 
                              color: isDark ? COLORS.white : COLORS.gray[900],
                              fontSize: settings.fontSize === 'large' ? 32 : 28,
                            }}
                          >
                            {selectedWord.slang_word}
                          </Text>
                          <Text 
                            className="text-lg"
                            style={{ 
                              color: isDark ? COLORS.gray[300] : COLORS.gray[700],
                              fontSize: settings.fontSize === 'large' ? 20 : 18,
                            }}
                          >
                            {selectedWord.dutch_meaning}
                          </Text>
                        </View>
                        {selectedWord.match_type !== 'exact' && (
                          <View className="bg-blue-100 rounded-full px-3 py-1">
                            <Text className="text-blue-700 text-xs font-medium">
                              {selectedWord.match_type === 'phonetic' ? 'Klinkt als' : 
                               selectedWord.match_type === 'fuzzy' ? 'Vergelijkbaar' : 
                               selectedWord.match_type.includes('variant') ? 'Variant' : ''}
                            </Text>
                          </View>
                        )}
                      </View>

                      {selectedWord.example_sentence && (
                        <View 
                          className="rounded-lg p-4 mb-4"
                          style={{ backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[100] }}
                        >
                          <Text 
                            className="text-sm uppercase font-medium mb-2 opacity-60"
                            style={{ color: isDark ? COLORS.gray[400] : COLORS.gray[600] }}
                          >
                            Voorbeeld
                          </Text>
                          <Text 
                            className="italic"
                            style={{ 
                              color: isDark ? COLORS.gray[200] : COLORS.gray[800],
                              fontSize: settings.fontSize === 'large' ? 16 : 14,
                            }}
                          >
                            "{selectedWord.example_sentence}"
                          </Text>
                        </View>
                      )}

                      <View className="flex-row items-center justify-between">
                        {selectedWord.audio_url ? (
                          <TouchableOpacity 
                            className="flex-row items-center rounded-full px-4 py-2"
                            style={{ backgroundColor: COLORS.primary[100] }}
                          >
                            <Ionicons name="volume-high" size={18} color={COLORS.primary[600]} />
                            <Text 
                              className="ml-2 font-medium"
                              style={{ color: COLORS.primary[600] }}
                            >
                              Uitspraak
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View />
                        )}

                        <View className="flex-row items-center">
                          <Text 
                            className="text-xs mr-2"
                            style={{ color: isDark ? COLORS.gray[500] : COLORS.gray[400] }}
                          >
                            Match: {Math.round(selectedWord.relevance_score * 100)}%
                          </Text>
                          <TouchableOpacity>
                            <Ionicons 
                              name="heart-outline" 
                              size={24} 
                              color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Recent Searches */}
                {!selectedWord && (
                  <RecentSearches onSelect={async (word) => {
                    // Find the word in database when selected from recent
                    try {
                      const results = await WordService.searchWords(word, 1);
                      if (results.length > 0) {
                        setSelectedWord(results[0] || null);
                      }
                    } catch (error) {
                      console.error('Error searching word:', error);
                    }
                  }} />
                )}
              </>
            ) : (
              <>
                {/* AI Translator */}
                <AITranslator
                  direction={direction}
                  onDirectionChange={() => setDirection(prev => prev === 'to_formal' ? 'to_slang' : 'to_formal')}
                />
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}