import { supabase } from './supabase';
import { validateEnvironment } from '@/src/env';
import { WordService } from './wordService';
import { ApiResponse } from '@/types';

export interface TranslationRequest {
  text: string;
  target: 'formal' | 'slang';
  context?: string;
}

export interface TranslationResponse {
  translation: string;
  confidence: number;
  alternatives?: string[];
  explanation?: string;
  source: 'database' | 'fallback' | 'none';
}

export interface TranslationFeedback {
  original_text: string;
  translation: string;
  target_language: 'formal' | 'slang';
  feedback_type: 'correct' | 'incorrect' | 'partially_correct';
  user_correction?: string | null;
  notes?: string;
}

export class TranslationService {
  /**
   * Smart translation with database lookup and fallback
   */
  static async translateText(text: string, target: 'formal' | 'slang'): Promise<TranslationResponse> {
    try {

      // First, try to find the word in our database
      const searchResult = await WordService.searchWords(text, 5);
      
      if (searchResult.length > 0) {
        // Check for exact matches
        const exactMatch = searchResult.find(result => 
          result.word.word.toLowerCase() === text.toLowerCase() ||
          result.word.meaning.toLowerCase() === text.toLowerCase()
        );

        if (exactMatch) {
          const translation = target === 'formal' 
            ? exactMatch.word.meaning 
            : exactMatch.word.word;

          return {
            translation,
            confidence: 0.95,
            alternatives: searchResult.slice(0, 3).map(result => 
              target === 'formal' ? result.word.meaning : result.word.word
            ),
            explanation: `Found in database: ${exactMatch.word.word} → ${exactMatch.word.meaning}`,
            source: 'database'
          };
        }

        // If no exact match but we have similar words, suggest them
        if (searchResult.length > 0) {
          const suggestions = searchResult.slice(0, 3).map(result => 
            target === 'formal' ? result.word.meaning : result.word.word
          );

          return {
            translation: suggestions[0],
            confidence: 0.7,
            alternatives: suggestions.slice(1),
            explanation: 'Similar words found in database',
            source: 'database'
          };
        }
      }

      // Fallback: Simple rule-based translation for common patterns
      const fallbackTranslation = this.getFallbackTranslation(text, target);
      
      if (fallbackTranslation) {
        return {
          translation: fallbackTranslation,
          confidence: 0.6,
          explanation: 'Rule-based translation',
          source: 'fallback'
        };
      }

      // Final fallback: return the original text with low confidence
      return {
        translation: text,
        confidence: 0.1,
        explanation: 'No translation found, returning original text',
        source: 'none'
      };

    } catch (error) {
      console.error('TranslationService.translateText error:', error);
      
      // Return fallback translation on error
      const fallbackTranslation = this.getFallbackTranslation(text, target);
      
      return {
        translation: fallbackTranslation || text,
        confidence: fallbackTranslation ? 0.3 : 0.1,
        explanation: 'Error occurred, using fallback',
        source: 'fallback'
      };
    }
  }

  /**
   * Submit feedback for a translation
   */
  static async submitFeedback(feedback: TranslationFeedback): Promise<ApiResponse<void>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Store feedback in database
      const { error } = await supabase
        .from('translation_feedback')
        .insert({
          user_id: session.user.id,
          original_text: feedback.original_text,
          translation: feedback.translation,
          target_language: feedback.target_language,
          feedback_type: feedback.feedback_type,
          user_correction: feedback.user_correction,
          notes: feedback.notes,
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('TranslationService.submitFeedback error:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Get translation history for a user
   */
  static async getTranslationHistory(userId: string, limit: number = 20): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('translation_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        success: true,
      };
    } catch (error) {
      console.error('TranslationService.getTranslationHistory error:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Smart translation - tries word lookup first, then fallback
   */
  static async smartTranslate(
    text: string, 
    direction: 'to_formal' | 'to_slang'
  ): Promise<TranslationResponse> {
    try {
      const target = direction === 'to_formal' ? 'formal' : 'slang';
      
      // Use the main translateText method
      return await this.translateText(text, target);
      
    } catch (error) {
      console.error('TranslationService.smartTranslate error:', error);
      throw error;
    }
  }

  /**
   * Batch translate multiple words
   */
  static async batchTranslate(
    texts: string[],
    target: 'formal' | 'slang'
  ): Promise<ApiResponse<TranslationResponse[]>> {
    try {
      const translations: TranslationResponse[] = [];
      
      for (const text of texts) {
        const translation = await this.translateText(text, target);
        translations.push(translation);
      }
      
      return {
        data: translations,
        success: true,
      };
    } catch (error) {
      console.error('TranslationService.batchTranslate error:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Get translation statistics
   */
  static async getTranslationStats(userId: string): Promise<ApiResponse<{
    total: number;
    correct: number;
    incorrect: number;
    partiallyCorrect: number;
    accuracy: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('translation_feedback')
        .select('feedback_type')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        correct: data?.filter(f => f.feedback_type === 'correct').length || 0,
        incorrect: data?.filter(f => f.feedback_type === 'incorrect').length || 0,
        partiallyCorrect: data?.filter(f => f.feedback_type === 'partially_correct').length || 0,
      };

      return {
        data: {
          ...stats,
          accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        },
        success: true,
      };
    } catch (error) {
      console.error('TranslationService.getTranslationStats error:', error);
      return {
        data: {
          total: 0,
          correct: 0,
          incorrect: 0,
          partiallyCorrect: 0,
          accuracy: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Simple fallback translation rules
   */
  private static getFallbackTranslation(text: string, target: 'formal' | 'slang'): string | null {
    const lowerText = text.toLowerCase();
    
    // Common slang to formal translations
    const slangToFormal: Record<string, string> = {
      'bruh': 'jongen',
      'cap': 'lieg',
      'no cap': 'echt waar',
      'sus': 'verdacht',
      'based': 'cool',
      'facts': 'eens',
      'vibe': 'sfeer',
      'slay': 'geweldig doen',
      'w': 'win',
      'l': 'verlies',
      'fr': 'echt waar',
      'ngl': 'niet gaan liegen',
      'tbh': 'om eerlijk te zijn',
      'imo': 'naar mijn mening',
      'btw': 'trouwens',
      'idk': 'ik weet het niet',
      'rn': 'nu',
      'ttyl': 'spreek je later',
      'brb': 'ben zo terug',
      'afk': 'niet aanwezig',
      'lit': 'geweldig',
      'fire': 'geweldig',
      'sick': 'geweldig',
      'dope': 'cool',
      'savage': 'brutaal',
      'flex': 'opscheppen',
      'salty': 'boos',
      'thirsty': 'wanhopig',
      'ghosting': 'negeren',
      'sliding into dms': 'berichten sturen',
    };

    // Formal to slang translations (reverse)
    const formalToSlang: Record<string, string> = {
      'jongen': 'bruh',
      'lieg': 'cap',
      'echt waar': 'no cap',
      'verdacht': 'sus',
      'cool': 'based',
      'eens': 'facts',
      'sfeer': 'vibe',
      'geweldig doen': 'slay',
      'win': 'w',
      'verlies': 'l',
      'geweldig': 'lit',
      'brutaal': 'savage',
      'opscheppen': 'flex',
      'boos': 'salty',
      'wanhopig': 'thirsty',
      'negeren': 'ghosting',
      'berichten sturen': 'sliding into dms',
    };

    if (target === 'formal') {
      return slangToFormal[lowerText] || null;
    } else {
      return formalToSlang[lowerText] || null;
    }
  }
}
