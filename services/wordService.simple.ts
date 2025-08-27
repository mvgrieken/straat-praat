import { supabase } from './supabase';

export interface WordSearchResult {
  word_id: string;
  slang_word: string;
  dutch_meaning: string;
  example_sentence: string | null;
  audio_url: string | null;
  match_type: string;
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
      const { data, error } = await supabase.rpc('search_words', {
        query_text: query,
        result_limit: limit
      });

      if (error) {
        console.error('Error searching words:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('WordService.searchWords error:', error);
      return [];
    }
  }

  /**
   * Get word of the day
   */
  static async getWordOfDay(targetDate?: string): Promise<WordOfDay | null> {
    try {
      const { data, error } = await supabase.rpc('get_word_of_day', 
        targetDate ? { target_date: targetDate } : {}
      );

      if (error) {
        console.error('Error getting word of day:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('WordService.getWordOfDay error:', error);
      return null;
    }
  }

  /**
   * Track word view/interaction (simplified)
   */
  static async trackWordView(userId: string, wordId: string): Promise<void> {
    try {
      // Simplified - just track that it was viewed
      console.log(`Word viewed: ${wordId} by user ${userId}`);
    } catch (error) {
      console.error('WordService.trackWordView error:', error);
    }
  }

  /**
   * Check if word is in user's favorites (simplified)
   */
  static async isFavorite(userId: string, wordId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if favorite:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('WordService.isFavorite error:', error);
      return false;
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
      }
    } catch (error) {
      console.error('WordService.addToFavorites error:', error);
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
      }
    } catch (error) {
      console.error('WordService.removeFromFavorites error:', error);
    }
  }
}