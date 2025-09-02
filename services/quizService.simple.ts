import { supabase } from './supabase';

export interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  audio_url: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string | null;
  created_at: string;
  updated_at: string;
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
    _userId: string,
    count: number = 5,
    difficulty?: number
  ): Promise<QuizQuestion[]> {
    try {
      // Get words from database
      let query = supabase
        .from('slang_words')
        .select('*');

      if (difficulty) {
        query = query.eq('difficulty', difficulty === 1 ? 'easy' : difficulty === 2 ? 'medium' : 'hard');
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
          .map(w => w.meaning);

        const options = [word.meaning, ...wrongAnswers]
          .sort(() => Math.random() - 0.5);

        questions.push({
          id: word.id,
          word: word,
          questionText: `Wat betekent "${word.word}"?`,
          correctAnswer: word.meaning,
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
        .select('*')
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
        ? data.reduce((sum, session) => sum + (session.score || 0), 0) / totalQuizzes
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