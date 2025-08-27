import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { QuizService, QuizQuestion } from '@/services/quizService';
import { GamificationService } from '@/services/gamificationService';

export default function QuizPlayScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<Array<{
    question: QuizQuestion;
    answer: string;
    isCorrect: boolean;
    responseTime: number;
  }>>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showFinalResults, setShowFinalResults] = useState(false);

  // Get difficulty based on level
  const getDifficulty = (level: string): number => {
    switch (level) {
      case '1': return 1; // easy
      case '2': return 2; // medium  
      case '3': return 5; // hard
      default: return 1;
    }
  };

  // Start quiz session
  const startQuizMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('User not authenticated');
      return QuizService.startQuizSession(user.id, 'general');
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
    },
    onError: (error) => {
      console.error('Error starting quiz:', error);
      Alert.alert('Fout', 'Quiz kon niet gestart worden. Probeer het opnieuw.');
      router.back();
    },
  });

  // Fetch questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz-questions', level, user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return QuizService.generateQuizQuestions(user.id, 5, getDifficulty(level || '1'));
    },
    enabled: !!user,
  });

  // Start session when questions are loaded
  useEffect(() => {
    if (questions && questions.length > 0 && !sessionId) {
      startQuizMutation.mutate();
    }
  }, [questions, sessionId]);

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ answer, responseTime }: { answer: string; responseTime: number }) => {
      if (!questions || !sessionId) return false;
      
      const currentQuestion = questions[currentQuestionIndex];
      
      return await QuizService.submitAnswer(
        sessionId,
        currentQuestion.word.id,
        currentQuestion.questionText,
        answer,
        currentQuestion.correctAnswer,
        responseTime
      );
    },
    onSuccess: (isCorrect) => {
      const currentQuestion = questions![currentQuestionIndex];
      const responseTime = Date.now() - questionStartTime;
      
      // Store the answer
      setUserAnswers(prev => [...prev, {
        question: currentQuestion,
        answer: selectedAnswer,
        isCorrect: isCorrect || false,
        responseTime
      }]);

      setShowResult(true);
    },
    onError: (error) => {
      console.error('Error submitting answer:', error);
      Alert.alert('Fout', 'Antwoord kon niet opgeslagen worden.');
    },
  });

  // Complete quiz mutation
  const completeQuizMutation = useMutation({
    mutationFn: () => QuizService.completeQuizSession(sessionId),
    onSuccess: async (result) => {
      if (!user) return;
      
      // Update user progress
      await QuizService.updateWordProgress(user.id, result.answers);
      
      // Award points based on performance
      await GamificationService.awardQuizPoints(
        user.id,
        result.score,
        result.answers.length,
        getDifficulty(level || '1')
      );
      
      setShowFinalResults(true);
    },
  });

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) {
      Alert.alert('Selecteer een antwoord', 'Kies eerst een antwoord voordat je doorgaat.');
      return;
    }

    const responseTime = Date.now() - questionStartTime;
    submitAnswerMutation.mutate({ answer: selectedAnswer, responseTime });
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer('');
    
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      completeQuizMutation.mutate();
    }
  };

  const handleQuitQuiz = () => {
    Alert.alert(
      'Quiz beëindigen?',
      'Weet je zeker dat je de quiz wilt beëindigen? Je voortgang gaat verloren.',
      [
        { text: 'Verder spelen', style: 'cancel' },
        { text: 'Beëindigen', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setUserAnswers([]);
    setShowFinalResults(false);
    startQuizMutation.mutate();
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text>Je moet ingelogd zijn om een quiz te spelen.</Text>
      </SafeAreaView>
    );
  }

  if (isLoading || !questions) {
    return (
      <SafeAreaView 
        style={{ 
          flex: 1, 
          backgroundColor: isDark ? COLORS.gray[900] : COLORS.gray[50],
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Text style={{ color: isDark ? COLORS.white : COLORS.gray[900] }}>
          Quiz wordt geladen...
        </Text>
      </SafeAreaView>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <SafeAreaView 
        style={{ 
          flex: 1, 
          backgroundColor: isDark ? COLORS.gray[900] : COLORS.gray[50],
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Text style={{ color: isDark ? COLORS.white : COLORS.gray[900] }}>
          Geen vragen beschikbaar voor dit niveau.
        </Text>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const correctAnswers = userAnswers.filter(a => a.isCorrect).length;

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: isDark ? COLORS.gray[900] : COLORS.gray[50] 
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={handleQuitQuiz}>
          <Ionicons 
            name="close" 
            size={28} 
            color={isDark ? COLORS.white : COLORS.gray[900]} 
          />
        </TouchableOpacity>
        
        <Text 
          className="font-semibold"
          style={{ 
            color: isDark ? COLORS.white : COLORS.gray[900],
            fontSize: settings.fontSize === 'large' ? 18 : 16,
          }}
        >
          Vraag {currentQuestionIndex + 1} van {questions.length}
        </Text>
        
        <Text 
          className="font-semibold"
          style={{ color: COLORS.primary[500] }}
        >
          {correctAnswers}/{userAnswers.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="mx-6 mb-6">
        <View 
          className="h-2 rounded-full"
          style={{ backgroundColor: isDark ? COLORS.gray[700] : COLORS.gray[300] }}
        >
          <View 
            className="h-2 rounded-full"
            style={{ 
              backgroundColor: COLORS.primary[500],
              width: `${progress}%`
            }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Question */}
        <View 
          className="rounded-2xl p-6 shadow-sm mb-6"
          style={{ 
            backgroundColor: isDark ? COLORS.gray[800] : COLORS.white,
            borderWidth: 1,
            borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200],
          }}
        >
          <Text 
            className="text-xl font-semibold mb-4 text-center"
            style={{ 
              color: isDark ? COLORS.white : COLORS.gray[900],
              fontSize: settings.fontSize === 'large' ? 24 : 20,
            }}
          >
            {currentQuestion.questionText}
          </Text>

          {/* Answer Options */}
          {currentQuestion.questionType === 'multiple_choice' || currentQuestion.questionType === 'example' ? (
            <View className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: showResult
                      ? option === currentQuestion.correctAnswer
                        ? COLORS.success[100]
                        : option === selectedAnswer && option !== currentQuestion.correctAnswer
                          ? COLORS.error[100]
                          : isDark ? COLORS.gray[700] : COLORS.gray[100]
                      : selectedAnswer === option
                        ? COLORS.primary[100]
                        : isDark ? COLORS.gray[700] : COLORS.gray[100],
                    borderWidth: 2,
                    borderColor: showResult
                      ? option === currentQuestion.correctAnswer
                        ? COLORS.success[500]
                        : option === selectedAnswer && option !== currentQuestion.correctAnswer
                          ? COLORS.error[500]
                          : 'transparent'
                      : selectedAnswer === option
                        ? COLORS.primary[500]
                        : 'transparent',
                  }}
                >
                  <Text 
                    className="text-center font-medium"
                    style={{ 
                      color: showResult
                        ? option === currentQuestion.correctAnswer
                          ? COLORS.success[700]
                          : option === selectedAnswer && option !== currentQuestion.correctAnswer
                            ? COLORS.error[700]
                            : isDark ? COLORS.gray[300] : COLORS.gray[700]
                        : selectedAnswer === option
                          ? COLORS.primary[700]
                          : isDark ? COLORS.gray[300] : COLORS.gray[700],
                      fontSize: settings.fontSize === 'large' ? 18 : 16,
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // Translation question - open input
            <View>
              <Text className="text-center text-gray-500 mb-4">
                Type je antwoord hieronder
              </Text>
              {/* TODO: Add TextInput for translation questions */}
            </View>
          )}
        </View>

        {/* Answer Button */}
        {!showResult ? (
          <TouchableOpacity
            onPress={handleAnswerSubmit}
            disabled={!selectedAnswer || submitAnswerMutation.isPending}
            className="rounded-xl py-4 mb-6"
            style={{ 
              backgroundColor: selectedAnswer && !submitAnswerMutation.isPending
                ? COLORS.primary[500] 
                : COLORS.gray[400],
            }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {submitAnswerMutation.isPending ? 'Controleren...' : 'Antwoord bevestigen'}
            </Text>
          </TouchableOpacity>
        ) : (
          /* Next Button */
          <TouchableOpacity
            onPress={handleNextQuestion}
            className="rounded-xl py-4 mb-6"
            style={{ backgroundColor: COLORS.primary[500] }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {currentQuestionIndex < questions.length - 1 ? 'Volgende vraag' : 'Quiz voltooien'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Final Results Modal */}
      <Modal
        visible={showFinalResults}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView 
          style={{ 
            flex: 1, 
            backgroundColor: isDark ? COLORS.gray[900] : COLORS.white 
          }}
        >
          <View className="flex-1 justify-center items-center px-6">
            <View className="items-center mb-8">
              <Text className="text-6xl mb-4">
                {correctAnswers === questions.length ? '🎉' : 
                 correctAnswers >= questions.length * 0.8 ? '🎊' : 
                 correctAnswers >= questions.length * 0.6 ? '👏' : '😊'}
              </Text>
              
              <Text 
                className="text-3xl font-bold mb-2"
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 36 : 28,
                }}
              >
                Quiz voltooid!
              </Text>
              
              <Text 
                className="text-xl text-center"
                style={{ 
                  color: isDark ? COLORS.gray[300] : COLORS.gray[600],
                  fontSize: settings.fontSize === 'large' ? 24 : 20,
                }}
              >
                Je hebt {correctAnswers} van de {questions.length} vragen goed!
              </Text>
            </View>

            <View 
              className="rounded-2xl p-6 w-full mb-8"
              style={{ 
                backgroundColor: isDark ? COLORS.gray[800] : COLORS.gray[100] 
              }}
            >
              <Text 
                className="text-center font-semibold mb-4"
                style={{ 
                  color: isDark ? COLORS.white : COLORS.gray[900],
                  fontSize: settings.fontSize === 'large' ? 20 : 18,
                }}
              >
                Je score: {Math.round((correctAnswers / questions.length) * 100)}%
              </Text>
              
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text 
                    className="text-2xl font-bold"
                    style={{ color: COLORS.success[500] }}
                  >
                    {correctAnswers}
                  </Text>
                  <Text 
                    className="text-sm"
                    style={{ color: isDark ? COLORS.gray[400] : COLORS.gray[600] }}
                  >
                    Correct
                  </Text>
                </View>
                
                <View className="items-center">
                  <Text 
                    className="text-2xl font-bold"
                    style={{ color: COLORS.error[500] }}
                  >
                    {questions.length - correctAnswers}
                  </Text>
                  <Text 
                    className="text-sm"
                    style={{ color: isDark ? COLORS.gray[400] : COLORS.gray[600] }}
                  >
                    Fout
                  </Text>
                </View>
                
                <View className="items-center">
                  <Text 
                    className="text-2xl font-bold"
                    style={{ color: COLORS.primary[500] }}
                  >
                    +{correctAnswers * 10}
                  </Text>
                  <Text 
                    className="text-sm"
                    style={{ color: isDark ? COLORS.gray[400] : COLORS.gray[600] }}
                  >
                    Punten
                  </Text>
                </View>
              </View>
            </View>

            <View className="w-full space-y-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="rounded-xl py-4"
                style={{ backgroundColor: COLORS.primary[500] }}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Terug naar Quiz Menu
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={restartQuiz}
                className="rounded-xl py-4"
                style={{ 
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderColor: COLORS.primary[500],
                }}
              >
                <Text 
                  className="text-center font-semibold text-lg"
                  style={{ color: COLORS.primary[500] }}
                >
                  Opnieuw spelen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}