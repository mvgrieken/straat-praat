import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { WordService } from '@/services/wordService.simple';

interface WordOfTheDayCardProps {
  onWordPress?: (wordId: string) => void;
}

export function WordOfTheDayCard({ onWordPress }: WordOfTheDayCardProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  const queryClient = useQueryClient();
  
  const [sound, setSound] = React.useState<Audio.Sound>();
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Fetch word of the day
  const { data: wordOfDay, isLoading } = useQuery({
    queryKey: ['word-of-day'],
    queryFn: () => WordService.getWordOfDay(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Check if word is favorite
  const { data: isFavorite } = useQuery({
    queryKey: ['is-favorite', wordOfDay?.word_id],
    queryFn: () => user && wordOfDay ? WordService.isFavorite(user.id, wordOfDay.word_id) : false,
    enabled: !!user && !!wordOfDay,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !wordOfDay) return;
      
      if (isFavorite) {
        await WordService.removeFromFavorites(user.id, wordOfDay.word_id);
      } else {
        await WordService.addToFavorites(user.id, wordOfDay.word_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorite', wordOfDay?.word_id] });
      queryClient.invalidateQueries({ queryKey: ['favorite-words'] });
    },
  });

  const playAudio = async () => {
    if (!wordOfDay?.audio_url) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      setIsPlaying(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: wordOfDay.audio_url },
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

  const handleWordPress = () => {
    if (wordOfDay && onWordPress) {
      onWordPress(wordOfDay.word_id);
      // Track word view
      if (user) {
        WordService.trackWordView(user.id, wordOfDay.word_id);
      }
    }
  };

  if (isLoading) {
    return (
      <View className="rounded-2xl h-40 bg-gray-200 animate-pulse">
        <View className="p-6 h-full justify-center">
          <Text className="text-gray-500 text-center">Woord van de dag wordt geladen...</Text>
        </View>
      </View>
    );
  }

  if (!wordOfDay) {
    return null;
  }

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <TouchableOpacity onPress={handleWordPress} activeOpacity={0.9}>
      <LinearGradient
        colors={
          isDark 
            ? [COLORS.primary[800], COLORS.primary[900]]
            : [COLORS.primary[500], COLORS.primary[600]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-6 shadow-lg"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text 
              className="text-white/80 text-sm font-medium"
              style={{ fontSize: settings.fontSize === 'large' ? 16 : 14 }}
            >
              Woord van de Dag
            </Text>
            <Text 
              className="text-white text-2xl font-bold"
              style={{ fontSize: settings.fontSize === 'large' ? 28 : 24 }}
            >
              {wordOfDay.slang_word}
            </Text>
          </View>
          <View className="bg-white/10 rounded-full p-3">
            <Ionicons name="book-outline" size={24} color="white" />
          </View>
        </View>

        <Text 
          className="text-white/90 text-lg mb-3"
          style={{ fontSize: settings.fontSize === 'large' ? 20 : 18 }}
        >
          {wordOfDay.dutch_meaning}
        </Text>

        {wordOfDay.example_sentence && (
          <View className="bg-white/10 rounded-lg p-3 mb-4">
            <Text 
              className="text-white/80 italic"
              style={{ fontSize: settings.fontSize === 'large' ? 16 : 14 }}
            >
              "{wordOfDay.example_sentence}"
            </Text>
          </View>
        )}

        <View className="flex-row justify-between items-center">
          {wordOfDay.audio_url && (
            <Pressable
              onPress={playAudio}
              className="flex-row items-center bg-white/20 rounded-full px-4 py-2"
              disabled={isPlaying}
            >
              <Ionicons 
                name={isPlaying ? "volume-medium" : "volume-high-outline"} 
                size={18} 
                color="white" 
              />
              <Text 
                className="text-white ml-2 font-medium"
                style={{ fontSize: settings.fontSize === 'large' ? 16 : 14 }}
              >
                {isPlaying ? 'Speelt af...' : 'Uitspraak'}
              </Text>
            </Pressable>
          )}
          
          <TouchableOpacity 
            className="bg-white/20 rounded-full p-2"
            onPress={() => toggleFavoriteMutation.mutate()}
            disabled={toggleFavoriteMutation.isPending}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}