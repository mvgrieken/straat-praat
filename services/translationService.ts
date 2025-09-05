import { TranslationResult, TranslationSource, Language } from '@/types';

import { supabase } from './supabase';
import { WordService } from './wordService';


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
  source: 'ai' | 'database' | 'fallback';
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TranslationFeedback {
  original_text: string;
  translation: string;
  target: 'formal' | 'slang';
  feedback: 'correct' | 'incorrect';
  user_correction?: string | null;
  notes?: string;
}

interface TranslationHistoryItem {
  id: string;
  user_id: string;
  original_text: string;
  translated_text: string;
  source: 'ai' | 'database' | 'fallback';
  confidence: number;
  created_at: string;
}

export class TranslationService {
  /**
   * Smart translation with AI-powered fallback
   */
  static async translateText(text: string, target: 'formal' | 'slang', context?: string): Promise<TranslationResponse> {
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required for AI translation');
      }

      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text: text.trim(),
          target,
          context,
          userId: session.user.id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('AI translation error:', error);
        // Fallback to database lookup
        return await this.fallbackToDatabase(text, target);
      }

      return data as TranslationResponse;

    } catch (error) {
      console.error('TranslationService.translateText error:', error);
      // Fallback to database lookup
      return await this.fallbackToDatabase(text, target);
    }
  }

  /**
   * Fallback to database lookup when AI fails
   */
  private static async fallbackToDatabase(text: string, target: 'formal' | 'slang'): Promise<TranslationResponse> {
    try {
      // First, try to find the word in our database
      const searchResult = await WordService.searchWords(text, 5);
      
      if (searchResult.length > 0) {
        // Check for exact matches
        const exactMatch = searchResult.find(result => 
          result.word.word.toLowerCase() === text.toLowerCase() ||
          result.word.meaning?.toLowerCase() === text.toLowerCase()
        );

        if (exactMatch) {
          const translation = target === 'formal' 
            ? exactMatch.word.meaning 
            : exactMatch.word.word;

          return {
            translation: translation || text,
            confidence: 0.95,
            alternatives: searchResult.slice(0, 3).map(result => 
              target === 'formal' ? result.word.meaning : result.word.word
            ).filter(Boolean),
            explanation: `Found in database: ${exactMatch.word.word} → ${exactMatch.word.meaning}`,
            source: 'database'
          };
        }

        // If no exact match but we have similar words, suggest them
        if (searchResult.length > 0) {
          const suggestions = searchResult.slice(0, 3).map(result => 
            target === 'formal' ? result.word.meaning : result.word.word
          ).filter(Boolean);

          return {
            translation: suggestions[0] || text,
            confidence: 0.7,
            alternatives: suggestions.slice(1),
            explanation: 'Similar words found in database',
            source: 'database'
          };
        }
      }

      // Final fallback: Simple rule-based translation
      return this.getFallbackTranslation(text, target);

    } catch (error) {
      console.error('Database fallback error:', error);
      return this.getFallbackTranslation(text, target);
    }
  }

  /**
   * Smart translation - tries AI first, then database fallback
   */
  static async smartTranslate(
    text: string, 
    direction: 'to_formal' | 'to_slang',
    context?: string
  ): Promise<TranslationResponse> {
    try {
      const target = direction === 'to_formal' ? 'formal' : 'slang';
      
      // Use the main translateText method with AI
      return await this.translateText(text, target, context);
      
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
    target: 'formal' | 'slang',
    context?: string
  ): Promise<TranslationResult<TranslationResponse[]>> {
    try {
      const results: TranslationResponse[] = [];
      
      for (const text of texts) {
        try {
          const result = await this.translateText(text, target, context);
          results.push(result);
        } catch (error) {
          console.error(`Batch translation error for "${text}":`, error);
          // Add fallback result
          results.push(this.getFallbackTranslation(text, target));
        }
      }

      return {
        data: results,
        success: true,
      };
    } catch (error) {
      console.error('Batch translation error:', error);
      return {
        error: error instanceof Error ? error.message : 'Batch translation failed',
        success: false,
      };
    }
  }

  /**
   * Submit feedback for a translation
   */
  static async submitFeedback(feedback: TranslationFeedback): Promise<TranslationResult<void>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('translation_feedback')
        .insert({
          user_id: session.user.id,
          original_text: feedback.original_text,
          translation: feedback.translation,
          target_language: feedback.target,
          feedback_type: feedback.feedback,
          user_correction: feedback.user_correction,
          notes: feedback.notes,
          created_at: new Date().toISOString(),
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
        error: error instanceof Error ? error.message : 'Failed to submit feedback',
        success: false,
      };
    }
  }

  /**
   * Get translation history for a user
   */
  static async getTranslationHistory(userId: string, limit: number = 20): Promise<TranslationResult<TranslationHistoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('translation_logs')
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
        error: error instanceof Error ? error.message : 'Failed to get translation history',
        success: false,
      };
    }
  }

  /**
   * Get translation statistics
   */
  static async getTranslationStats(userId: string): Promise<TranslationResult<{
    totalTranslations: number;
    aiTranslations: number;
    databaseTranslations: number;
    fallbackTranslations: number;
    averageConfidence: number;
    mostTranslatedWords: { word: string; count: number }[];
  }>> {
    try {
      const { data, error } = await supabase
        .from('translation_logs')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const translations = data || [];
      const totalTranslations = translations.length;
      
      const aiTranslations = translations.filter(t => t.source === 'ai').length;
      const databaseTranslations = translations.filter(t => t.source === 'database').length;
      const fallbackTranslations = translations.filter(t => t.source === 'fallback').length;
      
      const averageConfidence = totalTranslations > 0 
        ? translations.reduce((sum, t) => sum + (t.confidence || 0), 0) / totalTranslations
        : 0;

      // Get most translated words
      const wordCounts: Record<string, number> = {};
      translations.forEach(t => {
        const word = t.original_text.toLowerCase();
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });

      const mostTranslatedWords = Object.entries(wordCounts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        data: {
          totalTranslations,
          aiTranslations,
          databaseTranslations,
          fallbackTranslations,
          averageConfidence,
          mostTranslatedWords,
        },
        success: true,
      };
    } catch (error) {
      console.error('TranslationService.getTranslationStats error:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to get translation stats',
        success: false,
      };
    }
  }

  /**
   * Get fallback translation using rule-based approach
   */
  private static getFallbackTranslation(text: string, target: 'formal' | 'slang'): TranslationResponse {
    const lowerText = text.toLowerCase();
    
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

    let translation = text;
    let confidence = 0.1;

    if (target === 'formal') {
      translation = slangToFormal[lowerText] || text;
      confidence = slangToFormal[lowerText] ? 0.6 : 0.1;
    } else {
      translation = formalToSlang[lowerText] || text;
      confidence = formalToSlang[lowerText] ? 0.6 : 0.1;
    }

    return {
      translation,
      confidence,
      source: 'fallback',
      explanation: confidence > 0.1 ? 'Rule-based translation' : 'No translation found'
    };
  }
}
