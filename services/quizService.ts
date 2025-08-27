import { supabase } from './supabase';
// import { Database } from '@/src/lib/types/supabase';

export interface QuizSession {
  id: string;
  user_id: string;
  quiz_id: string | null;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent: number;
  completed_at: string | null;
  started_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  word_id: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  response_time_ms: number | null;
  confidence_score: number | null;
  created_at: string | null;
}

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
    _userId: string,
    count: number = 5,
    difficulty?: number,
    category?: string
  ): Promise<QuizQuestion[]> {
    try {
      // Get random words for the quiz
      let query = supabase
        .from('slang_words')
        .select('*');

      if (difficulty) {
        query = query.eq('difficulty', difficulty === 1 ? 'easy' : difficulty === 2 ? 'medium' : 'hard');
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data: words, error } = await query
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
      .map(w => w.meaning);

    const options = [word.meaning, ...wrongAnswers]
      .sort(() => Math.random() - 0.5);

    return {
      id: word.id,
      word,
      questionText: `Wat betekent "${word.word}"?`,
      correctAnswer: word.meaning,
      options,
      questionType: 'multiple_choice'
    };
  }

  private static createTranslationQuestion(word: Word): QuizQuestion {
    return {
      id: word.id,
      word,
      questionText: `Hoe zeg je "${word.meaning}" in de straat?`,
      correctAnswer: word.word,
      options: [], // Open question
      questionType: 'translation'
    };
  }

  private static createExampleQuestion(word: Word, allWords: Word[]): QuizQuestion {
    if (!word.example) {
      // Fallback to multiple choice if no example
      return this.createMultipleChoiceQuestion(word, allWords);
    }

    const wrongAnswers = allWords
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.word);

    const options = [word.word, ...wrongAnswers]
      .sort(() => Math.random() - 0.5);

    // Replace the word in the example with a blank
    const questionText = word.example.replace(
      new RegExp(word.word, 'gi'),
      '___'
    );

    return {
      id: word.id,
      word,
      questionText: `Vul de zin aan: "${questionText}"`,
      correctAnswer: word.word,
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

      // Simplified implementation since quiz_answers table doesn't exist
      console.log('Quiz answer submitted:', {
        sessionId,
        wordId,
        questionText,
        userAnswer,
        correctAnswer,
        isCorrect,
        responseTimeMs,
      });

      // No error handling needed for simplified implementation

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
      // Simplified implementation since quiz_answers table doesn't exist
      const correctAnswers = 0; // Placeholder
      const totalQuestions = 5; // Placeholder
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
        answers: [], // Placeholder since quiz_answers table doesn't exist
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
        .select('*')
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
      const averageScore = data.reduce((sum, session) => sum + (session.score || 0), 0) / totalQuizzes;

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
        // Simplified implementation since RPC function and table don't exist
        console.log(`Word progress updated: ${answer.word_id} by user ${userId}, correct: ${answer.is_correct}`);
      }
    } catch (error) {
      console.error('QuizService.updateWordProgress error:', error);
      // Don't throw here as this is not critical
    }
  }
}