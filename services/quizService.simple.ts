import { supabase } from './supabase';

export interface Word {
  id: string;
  slang_word: string;
  dutch_meaning: string;
  example_sentence: string | null;
  audio_url: string | null;
  difficulty_level: number | null;
}

export interface QuizQuestion {
  id: string;
  word: Word;
  questionText: string;
  correctAnswer: string;
  options: string[];
  questionType: 'multiple_choice' | 'translation' | 'example';
}

export interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  totalCorrect: number;
  averageScore: number;
}

export class QuizService {
  /**
   * Generate quiz questions (simplified)
   */
  static async generateQuizQuestions(
    userId: string,
    count: number = 5,
    difficulty?: number
  ): Promise<QuizQuestion[]> {
    try {
      // Get words from database
      let query = supabase
        .from('words')
        .select('*')
        .eq('is_active', true);

      if (difficulty) {
        query = query.eq('difficulty_level', difficulty);
      }

      const { data: words, error } = await query.limit(count * 2);

      if (error || !words || words.length === 0) {
        console.error('Error fetching words for quiz:', error);
        return [];
      }

      // Create simple multiple choice questions
      const shuffledWords = words.sort(() => Math.random() - 0.5).slice(0, count);
      const questions: QuizQuestion[] = [];

      for (const word of shuffledWords) {
        // Get wrong answers
        const wrongAnswers = words
          .filter(w => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.dutch_meaning);

        const options = [word.dutch_meaning, ...wrongAnswers]
          .sort(() => Math.random() - 0.5);

        questions.push({
          id: word.id,
          word: word,
          questionText: `Wat betekent "${word.slang_word}"?`,
          correctAnswer: word.dutch_meaning,
          options,
          questionType: 'multiple_choice'
        });
      }

      return questions;
    } catch (error) {
      console.error('QuizService.generateQuizQuestions error:', error);
      return [];
    }
  }

  /**
   * Get quiz statistics (simplified)
   */
  static async getQuizStats(userId: string): Promise<QuizStats> {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('total_questions, correct_answers, total_score')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      if (error || !data) {
        console.error('Error fetching quiz stats:', error);
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
      const averageScore = totalQuizzes > 0 
        ? data.reduce((sum, session) => sum + (session.total_score || 0), 0) / totalQuizzes
        : 0;

      return {
        totalQuizzes,
        totalQuestions,
        totalCorrect,
        averageScore: Math.round(averageScore)
      };
    } catch (error) {
      console.error('QuizService.getQuizStats error:', error);
      return {
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageScore: 0
      };
    }
  }

  /**
   * Placeholder for other methods
   */
  static async startQuizSession(userId: string): Promise<{ sessionId: string; questions: QuizQuestion[] }> {
    const questions = await this.generateQuizQuestions(userId, 5);
    return {
      sessionId: 'temp-session',
      questions
    };
  }

  static async submitAnswer(): Promise<boolean> {
    // Simplified for now
    return true;
  }

  static async completeQuizSession() {
    // Simplified for now
    return { session: {}, answers: [], score: 0, percentage: 0 };
  }

  static async updateWordProgress() {
    // Simplified for now
  }
}