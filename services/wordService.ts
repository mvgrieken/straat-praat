import { supabase } from './supabase';
import { Database, Tables } from '@/src/lib/types/database.types';

export type Word = Tables<'words'>;
export type WordSearchResult = Database['public']['Functions']['search_words']['Returns'][0];
export type WordOfDay = Database['public']['Functions']['get_word_of_day']['Returns'][0];

export class WordService {
  /**
   * Search for words using the database search function
   */
  static async searchWords(query: string, limit: number = 10): Promise<WordSearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('search_words', {
        query_text: query,
        result_limit: limit
      });

      if (error) {
        console.error('Error searching words:', error);
        throw error;
      }

      return data || [];
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
      const { data, error } = await supabase.rpc('get_word_of_day', {
        target_date: targetDate
      });

      if (error) {
        console.error('Error getting word of day:', error);
        throw error;
      }

      return data?.[0] || null;
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
        .from('words')
        .select('*')
        .eq('id', wordId)
        .eq('is_active', true)
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
        .from('user_favorites')
        .select(`
          word_id,
          words!inner (*)
        `)
        .eq('user_id', userId)
        .eq('words.is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting favorite words:', error);
        throw error;
      }

      return data?.map(item => item.words).filter(Boolean) || [];
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
        .from('user_favorites')
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
        .from('user_favorites')
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
        .from('user_favorites')
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
  static async getRecentWords(userId: string, limit: number = 10): Promise<Word[]> {
    try {
      const { data, error } = await supabase
        .from('user_word_progress')
        .select(`
          word_id,
          last_seen_at,
          words!inner (*)
        `)
        .eq('user_id', userId)
        .eq('words.is_active', true)
        .order('last_seen_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent words:', error);
        throw error;
      }

      return data?.map(item => item.words).filter(Boolean) || [];
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
      const { error } = await supabase.rpc('upsert_word_progress', {
        p_user_id: userId,
        p_word_id: wordId
      });

      if (error) {
        console.error('Error tracking word view:', error);
        // Don't throw here as this is not critical functionality
      }
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
        .from('words')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('usage_frequency', { ascending: false })
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