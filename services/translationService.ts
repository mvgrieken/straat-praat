import { supabase } from './supabase';

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
}

export interface TranslationFeedback {
  original_text: string;
  translation: string;
  target: 'formal' | 'slang';
  feedback: 'correct' | 'incorrect' | 'partially_correct';
  user_correction?: string;
  notes?: string;
}

export class TranslationService {
  /**
   * Translate text using the edge function
   */
  static async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `https://trrsgvxoylhcudtiimvb.supabase.co/functions/v1/translate-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('TranslationService.translateText error:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for a translation
   */
  static async submitFeedback(feedback: TranslationFeedback): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `https://trrsgvxoylhcudtiimvb.supabase.co/functions/v1/translation-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(feedback),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Feedback submitted successfully');
    } catch (error) {
      console.error('TranslationService.submitFeedback error:', error);
      throw error;
    }
  }

  /**
   * Get translation history for a user
   */
  static async getTranslationHistory(userId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('translation_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting translation history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('TranslationService.getTranslationHistory error:', error);
      throw error;
    }
  }

  /**
   * Smart translation - tries word lookup first, then AI translation
   */
  static async smartTranslate(
    text: string, 
    direction: 'to_formal' | 'to_slang'
  ): Promise<TranslationResponse> {
    try {
      // For single words, fallback to AI translation
      // (WordService integration can be added later to avoid circular imports)

      // Fallback to AI translation for phrases or unknown words
      return await TranslationService.translateText({
        text,
        target: direction === 'to_formal' ? 'formal' : 'slang'
      });
      
    } catch (error) {
      console.error('TranslationService.smartTranslate error:', error);
      throw error;
    }
  }
}