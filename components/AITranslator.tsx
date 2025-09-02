import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { COLORS } from '@/constants';
import { useSettings } from '@/hooks/useSettings';
import { TranslationService, TranslationResponse } from '@/services/translationService';

interface AITranslatorProps {
  direction: 'to_formal' | 'to_slang';
  onDirectionChange: () => void;
}

export function AITranslator({ direction, onDirectionChange }: AITranslatorProps) {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  const queryClient = useQueryClient();
  
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [context, setContext] = useState('');

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: (text: string) => TranslationService.smartTranslate(text.trim(), direction, context || undefined),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      console.error('Translation error:', error);
      Alert.alert('Fout', 'Vertaling mislukt. Probeer het opnieuw.');
    },
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: (feedback: 'correct' | 'incorrect') => {
      if (!result) return Promise.resolve();
      
      return TranslationService.submitFeedback({
        original_text: inputText,
        translation: result.translation,
        target: direction === 'to_formal' ? 'formal' : 'slang',
        feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translation-history'] });
      Alert.alert('Bedankt!', 'Je feedback is opgeslagen.');
    },
  });

  const handleTranslate = () => {
    if (!inputText.trim()) return;
    translateMutation.mutate(inputText);
  };

  const handleFeedback = (feedback: 'correct' | 'incorrect') => {
    feedbackMutation.mutate(feedback);
  };

  const clearInput = () => {
    setInputText('');
    setResult(null);
    setContext('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return COLORS.success;
    if (confidence >= 0.6) return COLORS.warning;
    return COLORS.error;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai':
        return 'sparkles';
      case 'database':
        return 'library';
      case 'fallback':
        return 'help-circle';
      default:
        return 'information-circle';
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'ai':
        return 'AI Vertaling';
      case 'database':
        return 'Database';
      case 'fallback':
        return 'Regel-gebaseerd';
      default:
        return 'Onbekend';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View className="flex-1 p-4">
        {/* Direction Toggle */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {direction === 'to_formal' ? 'Jongerenslang → Formeel' : 'Formeel → Jongerenslang'}
          </Text>
          <TouchableOpacity
            onPress={onDirectionChange}
            className="flex-row items-center bg-blue-500 px-3 py-2 rounded-lg"
          >
            <Ionicons name="swap-horizontal" size={16} color="white" />
            <Text className="text-white ml-1 font-medium">Wissel</Text>
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Tekst om te vertalen
          </Text>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={direction === 'to_formal' ? 'Voer jongerenslang in...' : 'Voer formele tekst in...'}
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`border rounded-lg p-3 text-base ${
              isDark 
                ? 'border-gray-600 bg-gray-800 text-white' 
                : 'border-gray-300 bg-white text-gray-900'
            }`}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Context Input (Optional) */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Context (optioneel)
          </Text>
          <TextInput
            value={context}
            onChangeText={setContext}
            placeholder="Voeg context toe voor betere vertaling..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`border rounded-lg p-3 text-base ${
              isDark 
                ? 'border-gray-600 bg-gray-800 text-white' 
                : 'border-gray-300 bg-white text-gray-900'
            }`}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Translate Button */}
        <TouchableOpacity
          onPress={handleTranslate}
          disabled={!inputText.trim() || translateMutation.isPending}
          className={`flex-row items-center justify-center py-3 rounded-lg mb-4 ${
            !inputText.trim() || translateMutation.isPending
              ? 'bg-gray-400'
              : 'bg-blue-500'
          }`}
        >
          {translateMutation.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name="language" size={20} color="white" />
          )}
          <Text className="text-white font-semibold ml-2">
            {translateMutation.isPending ? 'Vertalen...' : 'Vertalen'}
          </Text>
        </TouchableOpacity>

        {/* Result Section */}
        {result && (
          <View className={`border rounded-lg p-4 mb-4 ${
            isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
          }`}>
            {/* Translation Result */}
            <View className="mb-3">
              <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Vertaling
              </Text>
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.translation}
              </Text>
            </View>

            {/* Confidence and Source */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons 
                  name={getSourceIcon(result.source)} 
                  size={16} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
                <Text className={`text-sm ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {getSourceText(result.source)}
                </Text>
                {result.model && (
                  <Text className={`text-xs ml-2 px-2 py-1 rounded bg-blue-100 text-blue-800`}>
                    {result.model}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center">
                <View 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getConfidenceColor(result.confidence) }}
                />
                <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {Math.round(result.confidence * 100)}% zeker
                </Text>
              </View>
            </View>

            {/* Explanation */}
            {result.explanation && (
              <View className="mb-3">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {result.explanation}
                </Text>
              </View>
            )}

            {/* Alternatives */}
            {result.alternatives && result.alternatives.length > 0 && (
              <View className="mb-3">
                <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Alternatieven
                </Text>
                <View className="flex-row flex-wrap">
                  {result.alternatives.map((alt, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setResult({ ...result, translation: alt })}
                      className={`mr-2 mb-1 px-2 py-1 rounded border ${
                        isDark 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-gray-300 bg-gray-100'
                      }`}
                    >
                      <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {alt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Feedback Buttons */}
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => handleFeedback('correct')}
                disabled={feedbackMutation.isPending}
                className="flex-1 flex-row items-center justify-center py-2 bg-green-500 rounded-lg"
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text className="text-white font-medium ml-1">Correct</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleFeedback('incorrect')}
                disabled={feedbackMutation.isPending}
                className="flex-1 flex-row items-center justify-center py-2 bg-red-500 rounded-lg"
              >
                <Ionicons name="close" size={16} color="white" />
                <Text className="text-white font-medium ml-1">Incorrect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Clear Button */}
        {(inputText || result) && (
          <TouchableOpacity
            onPress={clearInput}
            className="flex-row items-center justify-center py-2 border border-gray-300 rounded-lg"
          >
            <Ionicons name="trash" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Wissen
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
