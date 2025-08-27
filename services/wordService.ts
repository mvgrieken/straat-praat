import { supabase } from './supabase';
// import { Database } from '@/src/lib/types/supabase';

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

export interface WordSearchResult {
  word_id: string;
  slang_word: string;
  dutch_meaning: string;
  example_sentence: string | null;
  audio_url: string | null;
  match_type: 'exact' | 'phonetic' | 'fuzzy' | 'variant';
  difficulty: 'easy' | 'medium' | 'hard';
  relevance_score: number;
}

export interface WordOfDay {
  word_id: string;
  slang_word: string;
  dutch_meaning: string;
  example_sentence: string | null;
  audio_url: string | null;
  difficulty_level: number;
}

export class WordService {
  /**
   * Search for words using the database search function
   */
  static async searchWords(query: string, limit: number = 10): Promise<WordSearchResult[]> {
    try {
      // Simple search implementation since RPC function doesn't exist
      const { data, error } = await supabase
        .from('slang_words')
        .select('*')
        .or(`word.ilike.%${query}%,meaning.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching words:', error);
        throw error;
      }

      // Transform data to match expected format
      return (data || []).map(word => ({
        word_id: word.id,
        slang_word: word.word,
        dutch_meaning: word.meaning,
        example_sentence: word.example,
        audio_url: word.audio_url,
        match_type: 'exact' as const,
        difficulty: word.difficulty,
        relevance_score: 1.0
      }));
    } catch (error) {
      console.error('WordService.searchWords error:', error);
      throw error;
    }
  }

  /**
   * Get word of the day
   */
  static async getWordOfDay(targetDate?: string): Promise<WordOfDay | null> {
    try {
      // Simple implementation since RPC function doesn't exist
      const dateToUse = (targetDate || new Date().toISOString().split('T')[0]) as string;
      const { data, error } = await supabase
        .from('word_of_the_day')
        .select('*, slang_words(*)')
        .eq('scheduled_date', dateToUse)
        .limit(1);

      if (error) {
        console.error('Error getting word of day:', error);
        throw error;
      }

      // Transform data to match expected format
      const wordOfDay = data?.[0];
      if (!wordOfDay?.slang_words) return null;
      
      return {
        word_id: wordOfDay.slang_words.id,
        slang_word: wordOfDay.slang_words.word,
        dutch_meaning: wordOfDay.slang_words.meaning,
        example_sentence: wordOfDay.slang_words.example,
        audio_url: wordOfDay.slang_words.audio_url,
        difficulty_level: wordOfDay.slang_words.difficulty === 'easy' ? 1 : wordOfDay.slang_words.difficulty === 'medium' ? 2 : 3
      };
    } catch (error) {
      console.error('WordService.getWordOfDay error:', error);
      throw error;
    }
  }

  /**
   * Get word by ID
   */
  static async getWordById(wordId: string): Promise<Word | null> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('*')
        .eq('id', wordId)
        .single();

      if (error) {
        console.error('Error getting word by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('WordService.getWordById error:', error);
      throw error;
    }
  }

  /**
   * Get user's favorite words
   */
  static async getFavoriteWords(userId: string, limit: number = 20): Promise<Word[]> {
    try {
      const { data, error } = await supabase
        .from('favorite_words')
        .select(`
          word_id,
          slang_words!inner (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting favorite words:', error);
        throw error;
      }

      return data?.map(item => item.slang_words).filter(Boolean) || [];
    } catch (error) {
      console.error('WordService.getFavoriteWords error:', error);
      throw error;
    }
  }

  /**
   * Add word to favorites
   */
  static async addToFavorites(userId: string, wordId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('favorite_words')
        .insert({
          user_id: userId,
          word_id: wordId
        });

      if (error) {
        console.error('Error adding to favorites:', error);
        throw error;
      }
    } catch (error) {
      console.error('WordService.addToFavorites error:', error);
      throw error;
    }
  }

  /**
   * Remove word from favorites
   */
  static async removeFromFavorites(userId: string, wordId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('favorite_words')
        .delete()
        .eq('user_id', userId)
        .eq('word_id', wordId);

      if (error) {
        console.error('Error removing from favorites:', error);
        throw error;
      }
    } catch (error) {
      console.error('WordService.removeFromFavorites error:', error);
      throw error;
    }
  }

  /**
   * Check if word is in user's favorites
   */
  static async isFavorite(userId: string, wordId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('favorite_words')
        .select('id')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking if favorite:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('WordService.isFavorite error:', error);
      return false;
    }
  }

  /**
   * Get recent words (recently searched/viewed)
   */
  static async getRecentWords(_userId: string, _limit: number = 10): Promise<Word[]> {
    try {
      // Simplified implementation since user_progress table doesn't exist
      return [];

      // No error handling needed for simplified implementation
    } catch (error) {
      console.error('WordService.getRecentWords error:', error);
      throw error;
    }
  }

  /**
   * Track word view/interaction
   */
  static async trackWordView(userId: string, wordId: string): Promise<void> {
    try {
      // Simplified implementation since RPC function doesn't exist
      console.log(`Word viewed: ${wordId} by user ${userId}`);

      // No error handling needed for simplified implementation
    } catch (error) {
      console.error('WordService.trackWordView error:', error);
    }
  }

  /**
   * Get words by category
   */
  static async getWordsByCategory(category: string, limit: number = 20): Promise<Word[]> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('*')
        .eq('category', category)
        .limit(limit);

      if (error) {
        console.error('Error getting words by category:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('WordService.getWordsByCategory error:', error);
      throw error;
    }
  }
}