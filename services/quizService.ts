import { supabase } from './supabase';
import { Database, Tables, TablesInsert } from '@/src/lib/types/database.types';

export type QuizSession = Tables<'quiz_sessions'>;
export type QuizAnswer = Tables<'quiz_answers'>;
export type Word = Tables<'words'>;

export interface QuizQuestion {
  id: string;
  word: Word;
  questionText: string;
  correctAnswer: string;
  options: string[];
  questionType: 'multiple_choice' | 'translation' | 'example';
}

export interface QuizSessionResult {
  session: QuizSession;
  answers: QuizAnswer[];
  score: number;
  percentage: number;
}

export class QuizService {
  /**
   * Generate quiz questions based on words
   */
  static async generateQuizQuestions(
    userId: string,
    count: number = 5,
    difficulty?: number,
    category?: string
  ): Promise<QuizQuestion[]> {
    try {
      // Get random words for the quiz
      let query = supabase
        .from('words')
        .select('*')
        .eq('is_active', true);

      if (difficulty) {
        query = query.eq('difficulty_level', difficulty);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data: words, error } = await query
        .order('usage_frequency', { ascending: false })
        .limit(count * 2); // Get more words to have variety

      if (error) {
        console.error('Error fetching words for quiz:', error);
        throw error;
      }

      if (!words || words.length === 0) {
        throw new Error('No words available for quiz');
      }

      // Shuffle and take the required count
      const shuffledWords = words.sort(() => Math.random() - 0.5).slice(0, count);
      const questions: QuizQuestion[] = [];

      for (const word of shuffledWords) {
        const question = await this.createQuestionFromWord(word, words);
        questions.push(question);
      }

      return questions;
    } catch (error) {
      console.error('QuizService.generateQuizQuestions error:', error);
      throw error;
    }
  }

  /**
   * Create a quiz question from a word
   */
  private static async createQuestionFromWord(
    word: Word,
    allWords: Word[]
  ): Promise<QuizQuestion> {
    const questionTypes: Array<'multiple_choice' | 'translation' | 'example'> = [
      'multiple_choice',
      'translation',
      'example'
    ];

    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    switch (questionType) {
      case 'multiple_choice':
        return this.createMultipleChoiceQuestion(word, allWords);
      case 'translation':
        return this.createTranslationQuestion(word);
      case 'example':
        return this.createExampleQuestion(word, allWords);
      default:
        return this.createMultipleChoiceQuestion(word, allWords);
    }
  }

  private static createMultipleChoiceQuestion(word: Word, allWords: Word[]): QuizQuestion {
    const wrongAnswers = allWords
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.dutch_meaning);

    const options = [word.dutch_meaning, ...wrongAnswers]
      .sort(() => Math.random() - 0.5);

    return {
      id: word.id,
      word,
      questionText: `Wat betekent "${word.slang_word}"?`,
      correctAnswer: word.dutch_meaning,
      options,
      questionType: 'multiple_choice'
    };
  }

  private static createTranslationQuestion(word: Word): QuizQuestion {
    return {
      id: word.id,
      word,
      questionText: `Hoe zeg je "${word.dutch_meaning}" in de straat?`,
      correctAnswer: word.slang_word,
      options: [], // Open question
      questionType: 'translation'
    };
  }

  private static createExampleQuestion(word: Word, allWords: Word[]): QuizQuestion {
    if (!word.example_sentence) {
      // Fallback to multiple choice if no example
      return this.createMultipleChoiceQuestion(word, allWords);
    }

    const wrongAnswers = allWords
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.slang_word);

    const options = [word.slang_word, ...wrongAnswers]
      .sort(() => Math.random() - 0.5);

    // Replace the word in the example with a blank
    const questionText = word.example_sentence.replace(
      new RegExp(word.slang_word, 'gi'),
      '___'
    );

    return {
      id: word.id,
      word,
      questionText: `Vul de zin aan: "${questionText}"`,
      correctAnswer: word.slang_word,
      options,
      questionType: 'example'
    };
  }

  /**
   * Start a new quiz session
   */
  static async startQuizSession(
    userId: string,
    sessionType: 'general' | 'daily' | 'lesson' = 'general'
  ): Promise<{ sessionId: string; questions: QuizQuestion[] }> {
    try {
      // Generate questions
      const questions = await this.generateQuizQuestions(userId, 5);

      // Create quiz session
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .insert({
          user_id: userId,
          session_type: sessionType,
          total_questions: questions.length,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating quiz session:', error);
        throw error;
      }

      return {
        sessionId: session.id,
        questions
      };
    } catch (error) {
      console.error('QuizService.startQuizSession error:', error);
      throw error;
    }
  }

  /**
   * Submit an answer to a quiz question
   */
  static async submitAnswer(
    sessionId: string,
    wordId: string,
    questionText: string,
    userAnswer: string,
    correctAnswer: string,
    responseTimeMs?: number
  ): Promise<boolean> {
    try {
      const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      const { error } = await supabase
        .from('quiz_answers')
        .insert({
          session_id: sessionId,
          word_id: wordId,
          question_text: questionText,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          is_correct: isCorrect,
          response_time_ms: responseTimeMs,
        });

      if (error) {
        console.error('Error submitting quiz answer:', error);
        throw error;
      }

      return isCorrect;
    } catch (error) {
      console.error('QuizService.submitAnswer error:', error);
      throw error;
    }
  }

  /**
   * Complete a quiz session
   */
  static async completeQuizSession(sessionId: string): Promise<QuizSessionResult> {
    try {
      // Get all answers for the session
      const { data: answers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .eq('session_id', sessionId);

      if (answersError) {
        console.error('Error fetching quiz answers:', answersError);
        throw answersError;
      }

      const correctAnswers = answers?.filter(a => a.is_correct).length || 0;
      const totalQuestions = answers?.length || 0;
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Update session with results
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .update({
          correct_answers: correctAnswers,
          total_score: score,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (sessionError) {
        console.error('Error updating quiz session:', sessionError);
        throw sessionError;
      }

      return {
        session,
        answers: answers || [],
        score: correctAnswers,
        percentage: score
      };
    } catch (error) {
      console.error('QuizService.completeQuizSession error:', error);
      throw error;
    }
  }

  /**
   * Get quiz history for a user
   */
  static async getQuizHistory(
    userId: string,
    limit: number = 10
  ): Promise<QuizSession[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching quiz history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('QuizService.getQuizHistory error:', error);
      throw error;
    }
  }

  /**
   * Get quiz statistics for a user
   */
  static async getQuizStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('total_questions, correct_answers, total_score')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      if (error) {
        console.error('Error fetching quiz stats:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalQuizzes: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          averageScore: 0
        };
      }

      const totalQuizzes = data.length;
      const totalQuestions = data.reduce((sum, session) => sum + (session.total_questions || 0), 0);
      const totalCorrect = data.reduce((sum, session) => sum + (session.correct_answers || 0), 0);
      const averageScore = data.reduce((sum, session) => sum + (session.total_score || 0), 0) / totalQuizzes;

      return {
        totalQuizzes,
        totalQuestions,
        totalCorrect,
        averageScore: Math.round(averageScore)
      };
    } catch (error) {
      console.error('QuizService.getQuizStats error:', error);
      throw error;
    }
  }

  /**
   * Update user word progress based on quiz performance
   */
  static async updateWordProgress(userId: string, answers: QuizAnswer[]): Promise<void> {
    try {
      for (const answer of answers) {
        // Update word progress
        await supabase.rpc('upsert_word_progress', {
          p_user_id: userId,
          p_word_id: answer.word_id
        });

        // If answer was correct, increase mastery
        if (answer.is_correct) {
          const { error } = await supabase
            .from('user_word_progress')
            .update({
              times_correct: supabase.sql`times_correct + 1`,
              mastery_level: supabase.sql`LEAST(mastery_level + 1, 5)`,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('word_id', answer.word_id);

          if (error) {
            console.error('Error updating word progress:', error);
          }
        }
      }
    } catch (error) {
      console.error('QuizService.updateWordProgress error:', error);
      // Don't throw here as this is not critical
    }
  }
}