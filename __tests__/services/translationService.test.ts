import { TranslationService } from '@/services/translationService';
import { WordService } from '@/services/wordService';
import { supabase } from '@/services/supabase';

// Mock dependencies
jest.mock('@/services/wordService');
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('TranslationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('translateText', () => {
    it('should translate text using database lookup successfully', async () => {
      const mockWord = {
        id: '1',
        slang_word: 'bruh',
        dutch_meaning: 'jongen',
        category: 'general',
        difficulty_level: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (WordService.searchWords as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          data: [mockWord],
          total: 1,
        },
      });

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result.translation).toBe('jongen');
      expect(result.confidence).toBe(0.95);
      expect(result.source).toBe('database');
      expect(WordService.searchWords).toHaveBeenCalledWith('bruh', 5);
    });

    it('should use fallback translation when database lookup fails', async () => {
      (WordService.searchWords as jest.Mock).mockResolvedValue([]);

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result.translation).toBe('jongen'); // Fallback translation
      expect(result.confidence).toBe(0.6);
      expect(result.source).toBe('fallback');
    });

    it('should handle invalid target language', async () => {
      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result.translation).toBe('jongen');
      expect(result.source).toBe('fallback');
    });

    it('should handle empty text', async () => {
      const result = await TranslationService.translateText('', 'formal');

      expect(result.translation).toBe('');
      expect(result.confidence).toBe(0.1);
      expect(result.source).toBe('none');
    });

    it('should handle WordService errors', async () => {
      (WordService.searchWords as jest.Mock).mockResolvedValue([]);

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result.source).toBe('fallback');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const mockSupabaseResponse = {
        data: null,
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue(mockSupabaseResponse),
      });

      const feedback = {
        original_text: 'bruh',
        translation: 'jongen',
        target_language: 'formal' as const,
        feedback_type: 'correct' as const,
        user_correction: null,
        notes: 'Great translation!',
      };

      const result = await TranslationService.submitFeedback(feedback);

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('translation_feedback');
    });

    it('should handle feedback submission errors', async () => {
      const mockError = new Error('Insert failed');

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockRejectedValue(mockError),
      });

      const feedback = {
        original_text: 'bruh',
        translation: 'jongen',
        target_language: 'formal' as const,
        feedback_type: 'correct' as const,
        user_correction: null,
        notes: 'Great translation!',
      };

      const result = await TranslationService.submitFeedback(feedback);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to submit feedback');
    });
  });

  describe('getTranslationHistory', () => {
    it('should return translation history successfully', async () => {
      const mockHistory = [
        {
          id: '1',
          user_id: 'user-1',
          original_text: 'bruh',
          translated_text: 'jongen',
          target_language: 'formal',
          rating: 5,
          feedback_text: 'Great translation!',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSupabaseResponse = {
        data: mockHistory,
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue(mockSupabaseResponse),
            }),
          }),
        }),
      });

      const result = await TranslationService.getTranslationHistory('user-1', 10);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });

    it('should handle history retrieval errors', async () => {
      const mockError = new Error('Query failed');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockRejectedValue(mockError),
            }),
          }),
        }),
      });

      const result = await TranslationService.getTranslationHistory('user-1', 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch translation history');
    });
  });

  describe('batchTranslate', () => {
    it('should translate multiple texts successfully', async () => {
      const mockWord = {
        id: '1',
        slang_word: 'bruh',
        dutch_meaning: 'jongen',
        category: 'general',
        difficulty_level: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (WordService.searchWords as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          data: [mockWord],
          total: 1,
        },
      });

      const texts = ['bruh', 'cap'];
      const result = await TranslationService.batchTranslate(texts, 'formal');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.translation).toBe('jongen');
    });

    it('should handle batch translation with mixed results', async () => {
      (WordService.searchWords as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: [{
              id: '1',
              slang_word: 'bruh',
              dutch_meaning: 'jongen',
              category: 'general',
              difficulty_level: 1,
              is_active: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            }],
            total: 1,
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: [],
            total: 0,
          },
        });

      const texts = ['bruh', 'unknown'];
      const result = await TranslationService.batchTranslate(texts, 'formal');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.source).toBe('database');
      expect(result.data?.[1]?.source).toBe('fallback');
    });
  });

  describe('getTranslationStats', () => {
    it('should return translation statistics successfully', async () => {
      const mockStats = {
        total_translations: 100,
        average_rating: 4.5,
        most_translated_words: ['bruh', 'cap'],
        user_feedback_count: 50,
      };

      const mockSupabaseResponse = {
        data: mockStats,
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockSupabaseResponse),
          }),
        }),
      });

      const result = await TranslationService.getTranslationStats('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });
  });
});
