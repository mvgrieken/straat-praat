import { supabase } from './supabase';

export interface TranslationRequest {
  text: string;
  target: 'formal' | 'slang';
  userId?: string;
}

export interface TranslationResult {
  translation: string;
  confidence: number;
  originalText: string;
  targetLanguage: 'formal' | 'slang';
  alternatives?: string[];
  notes?: string;
  timestamp: string;
}

export interface TranslationFeedback {
  originalText: string;
  translation: string;
  feedback: 'correct' | 'incorrect' | 'partially_correct';
  userComment?: string;
  userId?: string;
}

export class AITranslationService {
  private static readonly API_BASE_URL = process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'https://api.openai.com/v1';
  private static readonly API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  private static readonly MODEL = 'gpt-3.5-turbo';

  /**
   * Translate text using AI service
   */
  static async translateText(request: TranslationRequest): Promise<TranslationResult> {
    try {
      // Check if it's a single word first
      if (request.text.split(' ').length === 1) {
        return this.translateSingleWord(request.text, request.target);
      }

      // Use AI service for sentences
      const result = await this.callAIService(request);
      
      // Log translation for feedback collection
      await this.logTranslation(request, result);
      
      return result;
    } catch (error) {
      console.error('AI translation failed:', error);
      
      // Fallback to basic translation
      return this.fallbackTranslation(request);
    }
  }

  /**
   * Translate single word using database lookup
   */
  private static async translateSingleWord(word: string, target: 'formal' | 'slang'): Promise<TranslationResult> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('*')
        .or(`word.ilike.%${word}%,meaning.ilike.%${word}%`)
        .limit(1)
        .single();

      if (error || !data) {
        return {
          translation: `Woord "${word}" niet gevonden`,
          confidence: 0,
          originalText: word,
          targetLanguage: target,
          timestamp: new Date().toISOString(),
        };
      }

      const translation = target === 'formal' ? data.meaning : data.word;
      
      return {
        translation: translation || `Geen vertaling beschikbaar voor "${word}"`,
        confidence: 0.9,
        originalText: word,
        targetLanguage: target,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Single word translation failed:', error);
      return {
        translation: `Fout bij vertalen van "${word}"`,
        confidence: 0,
        originalText: word,
        targetLanguage: target,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Call external AI service
   */
  private static async callAIService(request: TranslationRequest): Promise<TranslationResult> {
    if (!this.API_KEY) {
      throw new Error('AI service API key not configured');
    }

    const prompt = this.buildPrompt(request);
    
    const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert in Nederlandse Straat-Praat en formele Nederlandse taal. Vertaal tekst tussen deze twee vormen.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.statusText}`);
    }

    const data = await response.json();
    const translation = data.choices[0]?.message?.content?.trim();

    if (!translation) {
      throw new Error('No translation received from AI service');
    }

    return {
      translation,
      confidence: this.calculateConfidence(translation, request.text),
      originalText: request.text,
      targetLanguage: request.target,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build prompt for AI service
   */
  private static buildPrompt(request: TranslationRequest): string {
    const direction = request.target === 'formal' ? 'Straat-Praat naar formeel Nederlands' : 'formeel Nederlands naar Straat-Praat';
    
    return `Vertaal de volgende tekst van ${direction}:

"${request.text}"

Regels:
- Behoud de betekenis en toon
- Gebruik natuurlijke, veelvoorkomende taal
- Als je twijfelt, geef dan aan dat je onzeker bent
- Geef alleen de vertaling, geen uitleg

Vertaling:`;
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(translation: string, original: string): number {
    // Simple heuristics for confidence
    let confidence = 0.8;
    
    // Lower confidence if translation is very short
    if (translation.length < original.length * 0.5) {
      confidence -= 0.2;
    }
    
    // Lower confidence if translation contains uncertainty markers
    if (translation.includes('?') || translation.includes('misschien') || translation.includes('mogelijk')) {
      confidence -= 0.3;
    }
    
    // Lower confidence if translation is identical to original
    if (translation.toLowerCase() === original.toLowerCase()) {
      confidence -= 0.4;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Fallback translation when AI service fails
   */
  private static fallbackTranslation(request: TranslationRequest): TranslationResult {
    return {
      translation: `Vertaling niet beschikbaar voor: "${request.text}"`,
      confidence: 0,
      originalText: request.text,
      targetLanguage: request.target,
      notes: 'AI service niet beschikbaar, probeer het later opnieuw',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Log translation for feedback collection
   */
  private static async logTranslation(request: TranslationRequest, result: TranslationResult): Promise<void> {
    try {
      await supabase
        .from('translation_history')
        .insert({
          user_id: request.userId,
          original_text: request.text,
          translated_text: result.translation,
          target_language: request.target,
          confidence: result.confidence,
          ai_model: this.MODEL,
        });
    } catch (error) {
      console.error('Failed to log translation:', error);
    }
  }

  /**
   * Submit feedback for translation
   */
  static async submitFeedback(feedback: TranslationFeedback): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('translation_feedback')
        .insert({
          user_id: feedback.userId,
          original_text: feedback.originalText,
          translation: feedback.translation,
          feedback_type: feedback.feedback,
          user_comment: feedback.userComment,
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return false;
    }
  }

  /**
   * Get translation history for user
   */
  static async getTranslationHistory(userId: string, limit: number = 50): Promise<TranslationResult[]> {
    try {
      const { data, error } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []).map(item => ({
        translation: item.translated_text,
        confidence: item.confidence,
        originalText: item.original_text,
        targetLanguage: item.target_language,
        timestamp: item.created_at,
      }));
    } catch (error) {
      console.error('Failed to get translation history:', error);
      return [];
    }
  }

  /**
   * Check if AI service is available
   */
  static async checkServiceHealth(): Promise<boolean> {
    try {
      if (!this.API_KEY) {
        return false;
      }

      const response = await fetch(`${this.API_BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
}
