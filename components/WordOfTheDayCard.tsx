import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

import { SlangWord } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { COLORS } from '@/constants';

interface WordOfTheDayCardProps {
  word: SlangWord;
}

export function WordOfTheDayCard({ word }: WordOfTheDayCardProps) {
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  
  const [sound, setSound] = React.useState<Audio.Sound>();
  const [isPlaying, setIsPlaying] = React.useState(false);

  const playAudio = async () => {
    if (!word.audioUrl) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      setIsPlaying(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: word.audioUrl },
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

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
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
            {word.word}
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
        {word.meaning}
      </Text>

      {word.example && (
        <View className="bg-white/10 rounded-lg p-3 mb-4">
          <Text 
            className="text-white/80 italic"
            style={{ fontSize: settings.fontSize === 'large' ? 16 : 14 }}
          >
            "{word.example}"
          </Text>
        </View>
      )}

      <View className="flex-row justify-between items-center">
        {word.audioUrl && (
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
        
        <TouchableOpacity className="bg-white/20 rounded-full p-2">
          <Ionicons name="heart-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}