import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { QuizService } from '@/services/quizService.simple';

interface QuizLevel {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  questionsCount: number;
  pointsReward: number;
}

export default function QuizScreen() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  // Fetch quiz statistics
  const { data: quizStats } = useQuery({
    queryKey: ['quiz-stats', user?.id],
    queryFn: () => user ? QuizService.getQuizStats(user.id) : null,
    enabled: !!user,
  });

  // Static quiz levels based on difficulty
  const quizLevels: QuizLevel[] = [
    {
      id: '1',
      name: 'Beginner Quiz',
      description: 'Start met de basis slangwoorden',
      difficulty: 'easy',
      icon: '🌟',
      questionsCount: 5,
      pointsReward: 25,
    },
    {
      id: '2', 
      name: 'Gevorderde Quiz',
      description: 'Test je kennis van populaire slang',
      difficulty: 'medium',
      icon: '🔥',
      questionsCount: 5,
      pointsReward: 50,
    },
    {
      id: '3',
      name: 'Expert Quiz',
      description: 'De moeilijkste slangwoorden',
      difficulty: 'hard',
      icon: '💎',
      questionsCount: 5,
      pointsReward: 100,
    },
  ];

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return COLORS.success[500];
      case 'medium':
        return COLORS.warning[500];
      case 'hard':
        return COLORS.error[500];
    }
  };

  const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'Makkelijk';
      case 'medium':
        return 'Gemiddeld';
      case 'hard':
        return 'Moeilijk';
    }
  };

  const startQuiz = (quiz: QuizLevel) => {
    if (!user) {
      Alert.alert('Inloggen vereist', 'Je moet ingelogd zijn om een quiz te spelen.');
      return;
    }

    router.push(`/quiz/${quiz.id}` as any);
  };

  const handleCustomQuiz = () => {
    Alert.alert('Binnenkort beschikbaar', 'De aangepaste quiz functie komt binnenkort beschikbaar.');
  };

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: isDark ? COLORS.gray[900] : COLORS.gray[50] 
      }}
    >
      <ScrollView className="flex-1">
        {/* Header */}
        <View style={{ padding: 24, paddingBottom: 16 }}>
          <Text 
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 28 : 24,
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            Quiz Challenge
          </Text>
          <Text 
            style={{ 
              color: isDark ? COLORS.gray[300] : COLORS.gray[600],
              fontSize: settings.fontSize === 'large' ? 18 : 16,
            }}
          >
            Test je kennis van de Straat-Praat!
          </Text>
        </View>

        {/* User Stats */}
        {user && (
          <View 
            style={{
              marginHorizontal: 24,
              marginBottom: 24,
              backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
            }}
          >
            <Text 
              style={{ 
                color: isDark ? COLORS.white : COLORS.gray[900],
                fontSize: settings.fontSize === 'large' ? 18 : 16,
                fontWeight: '600',
                marginBottom: 12,
              }}
            >
              Je statistieken
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <Text 
                  style={{ 
                    color: COLORS.primary[500],
                    fontSize: settings.fontSize === 'large' ? 24 : 20,
                    fontWeight: 'bold',
                  }}
                >
                  {quizStats?.totalQuizzes || 0}
                </Text>
                <Text 
                  style={{ 
                    color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                    fontSize: settings.fontSize === 'large' ? 14 : 12,
                  }}
                >
                  Quizzes
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text 
                  style={{ 
                    color: COLORS.success[500],
                    fontSize: settings.fontSize === 'large' ? 24 : 20,
                    fontWeight: 'bold',
                  }}
                >
                  {quizStats?.averageScore || 0}%
                </Text>
                <Text 
                  style={{ 
                    color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                    fontSize: settings.fontSize === 'large' ? 14 : 12,
                  }}
                >
                  Gemiddelde
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text 
                  style={{ 
                    color: COLORS.warning[500],
                    fontSize: settings.fontSize === 'large' ? 24 : 20,
                    fontWeight: 'bold',
                  }}
                >
                  {quizStats?.totalCorrect || 0}
                </Text>
                <Text 
                  style={{ 
                    color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                    fontSize: settings.fontSize === 'large' ? 14 : 12,
                  }}
                >
                  Correct
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quiz Levels */}
        <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
          <Text 
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 20 : 18,
              fontWeight: '600',
              marginBottom: 16,
            }}
          >
            Kies je niveau
          </Text>
          
          {quizLevels?.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              onPress={() => startQuiz(quiz)}
              style={{
                backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
                flexDirection: 'row',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <View 
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: `${getDifficultyColor(quiz.difficulty)}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 24 }}>{quiz.icon}</Text>
              </View>
              
              <View style={{ flex: 1 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  marginBottom: 4,
                }}>
                  <Text 
                    style={{ 
                      color: isDark ? COLORS.white : COLORS.gray[900],
                      fontSize: settings.fontSize === 'large' ? 18 : 16,
                      fontWeight: '600',
                      marginRight: 8,
                    }}
                  >
                    {quiz.name}
                  </Text>
                  <View 
                    style={{
                      backgroundColor: `${getDifficultyColor(quiz.difficulty)}20`,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                    }}
                  >
                    <Text 
                      style={{
                        color: getDifficultyColor(quiz.difficulty),
                        fontSize: settings.fontSize === 'large' ? 12 : 10,
                        fontWeight: '600',
                      }}
                    >
                      {getDifficultyLabel(quiz.difficulty)}
                    </Text>
                  </View>
                </View>
                
                <Text 
                  style={{ 
                    color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                    fontSize: settings.fontSize === 'large' ? 16 : 14,
                    marginBottom: 8,
                  }}
                >
                  {quiz.description}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons 
                    name="help-circle-outline" 
                    size={16} 
                    color={isDark ? COLORS.gray[400] : COLORS.gray[500]}
                  />
                  <Text 
                    style={{ 
                      color: isDark ? COLORS.gray[400] : COLORS.gray[500],
                      fontSize: settings.fontSize === 'large' ? 14 : 12,
                      marginLeft: 4,
                      marginRight: 16,
                    }}
                  >
                    {quiz.questionsCount} vragen
                  </Text>
                  
                  <Ionicons 
                    name="trophy-outline" 
                    size={16} 
                    color={isDark ? COLORS.gray[400] : COLORS.gray[500]}
                  />
                  <Text 
                    style={{ 
                      color: isDark ? COLORS.gray[400] : COLORS.gray[500],
                      fontSize: settings.fontSize === 'large' ? 14 : 12,
                      marginLeft: 4,
                    }}
                  >
                    {quiz.pointsReward} punten
                  </Text>
                </View>
              </View>
              
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={isDark ? COLORS.gray[400] : COLORS.gray[500]} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Quiz Button */}
        <View style={{ marginHorizontal: 24, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={handleCustomQuiz}
            style={{
              backgroundColor: COLORS.primary[500],
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color="white" 
              style={{ marginRight: 8 }}
            />
            <Text 
              style={{ 
                color: 'white',
                fontSize: settings.fontSize === 'large' ? 18 : 16,
                fontWeight: '600',
              }}
            >
              Aangepaste Quiz
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}