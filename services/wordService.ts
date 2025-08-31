import { supabase } from './supabase';
import { SlangWord, WordOfTheDay, UserProgress, SearchResult, ApiResponse, PaginatedResponse } from '@/types';

export class WordService {
  /**
   * Get all words with optional filtering
   */
  static async getWords(options: {
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<SlangWord>>> {
    try {
      let query = supabase
        .from('slang_words')
        .select('*');

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category);
      }
      if (options.difficulty) {
        query = query.eq('difficulty', options.difficulty);
      }
      if (options.search) {
        query = query.or(`word.ilike.%${options.search}%,meaning.ilike.%${options.search}%`);
      }

      // Apply pagination
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        data: {
          data: data || [],
          pagination: {
            total: count || 0,
            page: Math.floor(offset / limit) + 1,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
          },
          success: true,
        },
        success: true,
      };
    } catch (error) {
      console.error('Error fetching words:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Get a single word by ID
   */
  static async getWordById(wordId: string): Promise<ApiResponse<SlangWord>> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('*')
        .eq('id', wordId)
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching word:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Search words with fuzzy matching
   */
  static async searchWords(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('*')
        .or(`word.ilike.%${query}%,meaning.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        throw error;
      }

      // Calculate relevance scores
      const results: SearchResult[] = (data || []).map(word => {
        const wordLower = word.word.toLowerCase();
        const meaningLower = word.meaning?.toLowerCase() || '';
        const queryLower = query.toLowerCase();

        let relevance = 0;
        let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';

        // Exact match gets highest score
        if (wordLower === queryLower || meaningLower === queryLower) {
          relevance = 1.0;
          matchType = 'exact';
        }
        // Partial match gets medium score
        else if (wordLower.includes(queryLower) || meaningLower.includes(queryLower)) {
          relevance = 0.8;
          matchType = 'partial';
        }
        // Fuzzy match gets lower score
        else {
          relevance = 0.3;
        }

        return {
          word,
          relevance,
          matchType,
        };
      });

      // Sort by relevance
      return results.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Error searching words:', error);
      return [];
    }
  }

  /**
   * Get word of the day
   */
  static async getWordOfTheDay(date?: string): Promise<ApiResponse<WordOfTheDay>> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      if (!targetDate) {
        throw new Error('Invalid date');
      }

      const { data, error } = await supabase
        .from('word_of_the_day')
        .select('*')
        .eq('scheduled_date', targetDate)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No word of the day found');
      }

      // Transform the data to match the WordOfTheDay interface
      const wordOfTheDay: WordOfTheDay = {
        id: data.id,
        word_id: data.word_id,
        word: (data as any).word || '',
        definition: (data as any).definition || '',
        example: (data as any).example,
        scheduled_date: (data as any).scheduled_date,
        date: (data as any).date,
        created_at: data.created_at,
        updated_at: (data as any).updated_at || data.created_at,
      };
      
      return {
        data: wordOfTheDay,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching word of the day:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Get user word progress
   */
  static async getUserWordProgress(userId: string, limit: number = 50): Promise<UserProgress[]> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_reviewed_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user word progress:', error);
      return [];
    }
  }

  /**
   * Update word progress
   */
  static async updateWordProgress(userId: string, wordId: string, progress: Partial<UserProgress>): Promise<ApiResponse<UserProgress>> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          word_id: wordId,
          mastery_level: progress.mastery_level || 0,
          times_reviewed: progress.times_reviewed || 0,
          correct_answers: progress.correct_answers || 0,
          incorrect_answers: progress.incorrect_answers || 0,
          last_reviewed_at: progress.last_reviewed_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('Error updating word progress:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Get user favorite words
   */
  static async getFavoriteWords(userId: string): Promise<SlangWord[]> {
    try {
      const { data, error } = await supabase
        .from('favorite_words')
        .select('word_id')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      const wordIds = data.map(item => item.word_id);
      const { data: words, error: wordsError } = await supabase
        .from('slang_words')
        .select('*')
        .in('id', wordIds);

      if (wordsError) {
        throw wordsError;
      }

      return words || [];
    } catch (error) {
      console.error('Error fetching favorite words:', error);
      return [];
    }
  }

  /**
   * Add word to favorites
   */
  static async addToFavorites(userId: string, wordId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('favorite_words')
        .insert({
          user_id: userId,
          word_id: wordId,
          added_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Remove word from favorites
   */
  static async removeFromFavorites(userId: string, wordId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('favorite_words')
        .delete()
        .eq('user_id', userId)
        .eq('word_id', wordId);

      if (error) {
        throw error;
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Get words by category
   */
  static async getWordsByCategory(category: string, limit: number = 20): Promise<SlangWord[]> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('*')
        .eq('category', category)
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching words by category:', error);
      return [];
    }
  }

  /**
   * Get random words
   */
  static async getRandomWords(count: number = 10): Promise<SlangWord[]> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('*')
        .limit(count);

      if (error) {
      throw error;
      }

      // Shuffle the results
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      return shuffled;
    } catch (error) {
      console.error('Error fetching random words:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<{
    totalWordsLearned: number;
    currentStreak: number;
    longestStreak: number;
    totalQuizScore: number;
    quizzesCompleted: number;
    achievementsUnlocked: number;
    currentLevel: number;
    experiencePoints: number;
    experienceToNextLevel: number;
  }> {
    try {
      // Get user progress
      const progress = await this.getUserWordProgress(userId, 1000);
             const totalWordsLearned = progress.filter(p => (p.mastery_level || 0) >= 80).length;

      // Get user profile for streaks and level
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, level, total_points')
        .eq('id', userId)
        .single();

      // Get quiz statistics
      let totalQuizScore = 0;
      let quizzesCompleted = 0;
      
      try {
        const { data: quizSessions } = await supabase
          .from('quiz_sessions')
          .select('total_score, total_questions')
          .eq('user_id', userId);

        totalQuizScore = (quizSessions || []).reduce((sum, session) => sum + (session.total_score || 0), 0);
        quizzesCompleted = quizSessions?.length || 0;
      } catch (error) {
        console.warn('Could not fetch quiz statistics:', error);
      }

             // Get achievements (placeholder - table doesn't exist yet)
       const achievementsUnlocked = 0;

      // Calculate level and experience
      const currentLevel = profile?.level || 1;
      const experiencePoints = profile?.total_points || 0;
      const experienceToNextLevel = Math.pow(currentLevel + 1, 2) * 100 - experiencePoints;

      return {
        totalWordsLearned,
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        totalQuizScore,
        quizzesCompleted,
        achievementsUnlocked,
        currentLevel,
        experiencePoints,
        experienceToNextLevel: Math.max(0, experienceToNextLevel),
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalWordsLearned: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalQuizScore: 0,
        quizzesCompleted: 0,
        achievementsUnlocked: 0,
        currentLevel: 1,
        experiencePoints: 0,
        experienceToNextLevel: 100,
      };
    }
  }
}