import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

import { COLORS } from '@/constants';
import { useSettings } from '@/hooks/useSettings';

interface TranslationResultProps {
  result: {
    original: string;
    translation: string;
    example?: string;
    audioUrl?: string | null;
    confidence?: number;
  };
  isLoading: boolean;
  direction: 'slang_to_dutch' | 'dutch_to_slang';
}

export function TranslationResult({ result, isLoading, direction }: TranslationResultProps) {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  
  const [sound, setSound] = React.useState<Audio.Sound>();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(false);

  const playAudio = async () => {
    if (!result.audioUrl) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      setIsPlaying(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: result.audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    // TODO: Implement actual favorite toggle API call
  };

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  if (isLoading) {
    return (
      <View 
        className="rounded-2xl p-6 shadow-sm items-center"
        style={{ 
          backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
          borderWidth: 1,
          borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
        <Text 
          className="mt-3 opacity-70"
          style={{ 
            color: isDark ? COLORS.gray[300] : COLORS.gray[600],
            fontSize: settings.fontSize === 'large' ? 16 : 14,
          }}
        >
          Aan het vertalen...
        </Text>
      </View>
    );
  }

  return (
    <View 
      className="rounded-2xl p-6 shadow-sm"
      style={{ 
        backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
        borderWidth: 1,
        borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
      }}
    >
      {/* Header with confidence indicator */}
      <View className="flex-row items-center justify-between mb-4">
        <Text 
          className="font-semibold"
          style={{ 
            color: isDark ? COLORS.white : COLORS.gray[900],
            fontSize: settings.fontSize === 'large' ? 18 : 16,
          }}
        >
          Vertaling gevonden
        </Text>
        
        {result.confidence && (
          <View className="flex-row items-center">
            <View 
              className="w-2 h-2 rounded-full mr-1"
              style={{ 
                backgroundColor: result.confidence > 0.8 
                  ? COLORS.success[500] 
                  : result.confidence > 0.6 
                    ? COLORS.warning[500] 
                    : COLORS.error[500]
              }}
            />
            <Text 
              className="opacity-70"
              style={{ 
                color: isDark ? COLORS.gray[400] : COLORS.gray[500],
                fontSize: settings.fontSize === 'large' ? 12 : 10,
              }}
            >
              {Math.round(result.confidence * 100)}% zeker
            </Text>
          </View>
        )}
      </View>

      {/* Translation */}
      <View className="mb-6">
        <View className="flex-row items-center mb-2">
          <Text 
            className="opacity-60 mr-2"
            style={{ 
              color: isDark ? COLORS.gray[400] : COLORS.gray[500],
              fontSize: settings.fontSize === 'large' ? 14 : 12,
            }}
          >
            {direction === 'slang_to_dutch' ? 'Straat-Praat:' : 'Nederlands:'}
          </Text>
          <View 
            className="rounded-full px-2 py-1"
            style={{ backgroundColor: COLORS.primary[100] }}
          >
            <Text 
              className="font-medium"
              style={{ 
                color: COLORS.primary[700],
                fontSize: settings.fontSize === 'large' ? 14 : 12,
              }}
            >
              {result.original}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Ionicons 
            name="arrow-down" 
            size={16} 
            color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
          />
          <Text 
            className="opacity-60 ml-2 mr-2"
            style={{ 
              color: isDark ? COLORS.gray[400] : COLORS.gray[500],
              fontSize: settings.fontSize === 'large' ? 14 : 12,
            }}
          >
            {direction === 'slang_to_dutch' ? 'Nederlands:' : 'Straat-Praat:'}
          </Text>
        </View>

        <Text 
          className="font-bold mt-2"
          style={{ 
            color: isDark ? COLORS.white : COLORS.gray[900],
            fontSize: settings.fontSize === 'large' ? 24 : 20,
          }}
        >
          {result.translation}
        </Text>
      </View>

      {/* Example */}
      {result.example && (
        <View 
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[100] }}
        >
          <Text 
            className="opacity-70 mb-2"
            style={{ 
              color: isDark ? COLORS.gray[400] : COLORS.gray[500],
              fontSize: settings.fontSize === 'large' ? 14 : 12,
            }}
          >
            Voorbeeld:
          </Text>
          <Text 
            className="italic"
            style={{ 
              color: isDark ? COLORS.gray[300] : COLORS.gray[600],
              fontSize: settings.fontSize === 'large' ? 16 : 14,
            }}
          >
            "{result.example}"
          </Text>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {result.audioUrl && (
            <TouchableOpacity
              onPress={playAudio}
              className="flex-row items-center rounded-full px-4 py-2 mr-3"
              style={{ backgroundColor: COLORS.primary[100] }}
              disabled={isPlaying}
            >
              <Ionicons 
                name={isPlaying ? "volume-medium" : "volume-high-outline"} 
                size={18} 
                color={COLORS.primary[600]} 
              />
              <Text 
                className="ml-2 font-medium"
                style={{ 
                  color: COLORS.primary[600],
                  fontSize: settings.fontSize === 'large' ? 14 : 12,
                }}
              >
                {isPlaying ? 'Speelt af...' : 'Uitspraak'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity className="rounded-full p-2">
            <Ionicons 
              name="share-outline" 
              size={20} 
              color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={toggleFavorite}
          className="rounded-full p-2"
        >
          <Ionicons 
            name={isFavorited ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorited ? COLORS.error[500] : (isDark ? COLORS.gray[400] : COLORS.gray[500])} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}