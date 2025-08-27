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
} from 'react-native';

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { TranslationService, TranslationResponse } from '@/services/translationService';

interface AITranslatorProps {
  direction: 'to_formal' | 'to_slang';
  onDirectionChange: () => void;
}

export function AITranslator({ direction, onDirectionChange }: AITranslatorProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  const queryClient = useQueryClient();
  
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResponse | null>(null);

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: (text: string) => TranslationService.smartTranslate(text.trim(), direction),
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
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      {/* Direction Toggle */}
      <View className="mb-6">
        <TouchableOpacity
          onPress={onDirectionChange}
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
            {direction === 'to_formal' ? 'Slang → Nederlands' : 'Nederlands → Slang'}
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

      {/* Input Section */}
      <View 
        className="rounded-2xl shadow-sm mb-6"
        style={{ 
          backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
          borderWidth: 1,
          borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
        }}
      >
        <View className="p-4">
          <Text 
            className="text-sm font-medium mb-3"
            style={{ color: isDark ? COLORS.gray[300] : COLORS.gray[600] }}
          >
            {direction === 'to_formal' ? 'Slang tekst' : 'Nederlandse tekst'}
          </Text>
          
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              direction === 'to_formal' 
                ? 'Typ hier je slang tekst...'
                : 'Typ hier je Nederlandse tekst...'
            }
            placeholderTextColor={isDark ? COLORS.gray[500] : COLORS.gray[400]}
            multiline
            numberOfLines={3}
            className="min-h-20"
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 18 : 16,
              textAlignVertical: 'top',
            }}
            onSubmitEditing={handleTranslate}
          />
        </View>
        
        <View className="flex-row items-center justify-between p-4 pt-0">
          {inputText.length > 0 && (
            <TouchableOpacity onPress={clearInput}>
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={isDark ? COLORS.gray[500] : COLORS.gray[400]} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={handleTranslate}
            disabled={!inputText.trim() || translateMutation.isPending}
            className="rounded-xl px-4 py-2 flex-row items-center"
            style={{ 
              backgroundColor: inputText.trim() && !translateMutation.isPending
                ? COLORS.primary[500] 
                : COLORS.gray[300],
            }}
          >
            {translateMutation.isPending ? (
              <Text className="text-white font-medium">Vertalen...</Text>
            ) : (
              <>
                <Ionicons name="language" size={16} color="white" />
                <Text className="text-white font-medium ml-2">Vertaal</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Result Section */}
      {result && (
        <View 
          className="rounded-2xl shadow-lg p-6"
          style={{ 
            backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
            borderWidth: 1,
            borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
          }}
        >
          <Text 
            className="text-sm font-medium mb-3"
            style={{ color: isDark ? COLORS.gray[300] : COLORS.gray[600] }}
          >
            {direction === 'to_formal' ? 'Nederlandse vertaling' : 'Slang vertaling'}
          </Text>
          
          <Text 
            className="text-xl font-semibold mb-4"
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 24 : 20,
            }}
          >
            {result.translation}
          </Text>

          {result.explanation && (
            <View 
              className="rounded-lg p-3 mb-4"
              style={{ backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[100] }}
            >
              <Text 
                className="text-sm"
                style={{ color: isDark ? COLORS.gray[300] : COLORS.gray[600] }}
              >
                {result.explanation}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View 
                className="rounded-full px-3 py-1 mr-3"
                style={{ 
                  backgroundColor: result.confidence >= 0.8 
                    ? COLORS.success[100] 
                    : result.confidence >= 0.6 
                      ? COLORS.warning[100]
                      : COLORS.error[100]
                }}
              >
                <Text 
                  className="text-xs font-medium"
                  style={{ 
                    color: result.confidence >= 0.8 
                      ? COLORS.success[700] 
                      : result.confidence >= 0.6 
                        ? COLORS.warning[700]
                        : COLORS.error[700]
                  }}
                >
                  {Math.round(result.confidence * 100)}% zeker
                </Text>
              </View>

              {result.confidence < 0.7 && (
                <Text 
                  className="text-xs"
                  style={{ color: isDark ? COLORS.gray[400] : COLORS.gray[500] }}
                >
                  Controleer het resultaat
                </Text>
              )}
            </View>

            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => handleFeedback('correct')}
                disabled={feedbackMutation.isPending}
                className="mr-3 p-2"
              >
                <Ionicons 
                  name="thumbs-up" 
                  size={20} 
                  color={COLORS.success[500]} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleFeedback('incorrect')}
                disabled={feedbackMutation.isPending}
                className="p-2"
              >
                <Ionicons 
                  name="thumbs-down" 
                  size={20} 
                  color={COLORS.error[500]} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}