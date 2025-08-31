import { TranslationService } from '@/services/translationService';
import { WordService } from '@/services/wordService';

// Mock WordService
jest.mock('@/services/wordService', () => ({
  WordService: {
    searchWords: jest.fn(),
  },
}));

const mockWordService = WordService as jest.Mocked<typeof WordService>;

describe('TranslationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('translateText', () => {
    it('should translate text using database lookup successfully', async () => {
      const mockSearchResult = [
        {
          word: {
            id: '1',
            word: 'bruh',
            meaning: 'jongen, broer',
            example: 'Hey bruh, alles goed?',
            audio_url: null,
            difficulty: 'easy',
            category: 'general',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          relevance: 1.0,
          matchType: 'exact' as const,
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockSearchResult);

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(mockWordService.searchWords).toHaveBeenCalledWith('bruh', 5);
      expect(result.translation).toBe('jongen, broer');
      expect(result.confidence).toBe(0.95);
      expect(result.source).toBe('database');
      expect(result.alternatives).toHaveLength(1);
      expect(result.explanation).toContain('Found in database');
    });

    it('should translate formal to slang successfully', async () => {
      const mockSearchResult = [
        {
          word: {
            id: '1',
            word: 'bruh',
            meaning: 'jongen, broer',
            example: 'Hey bruh, alles goed?',
            audio_url: null,
            difficulty: 'easy',
            category: 'general',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          relevance: 1.0,
          matchType: 'exact' as const,
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockSearchResult);

      const result = await TranslationService.translateText('jongen', 'slang');

      expect(result.translation).toBe('bruh');
      expect(result.confidence).toBe(0.95);
      expect(result.source).toBe('database');
    });

    it('should handle multiple search results and suggest alternatives', async () => {
      const mockSearchResults = [
        {
          word: {
            id: '1',
            word: 'bruh',
            meaning: 'jongen, broer',
            example: 'Hey bruh, alles goed?',
            audio_url: null,
            difficulty: 'easy',
            category: 'general',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          relevance: 0.8,
          matchType: 'partial' as const,
        },
        {
          word: {
            id: '2',
            word: 'bro',
            meaning: 'broer, vriend',
            example: 'Hey bro, hoe gaat het?',
            audio_url: null,
            difficulty: 'easy',
            category: 'general',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          relevance: 0.6,
          matchType: 'fuzzy' as const,
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockSearchResults);

      const result = await TranslationService.translateText('bru', 'formal');

      expect(result.translation).toBe('jongen, broer');
      expect(result.confidence).toBe(0.7);
      expect(result.alternatives).toHaveLength(2);
      expect(result.explanation).toBe('Similar words found in database');
    });

    it('should use fallback translation when database lookup fails', async () => {
      mockWordService.searchWords.mockResolvedValue([]);

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result.translation).toBe('jongen');
      expect(result.confidence).toBe(0.6);
      expect(result.source).toBe('fallback');
    });

    it('should handle empty text input', async () => {
      const result = await TranslationService.translateText('', 'formal');

      expect(result.translation).toBe('');
      expect(result.confidence).toBe(0.1);
      expect(result.source).toBe('none');
    });

    it('should handle WordService errors gracefully', async () => {
      mockWordService.searchWords.mockRejectedValue(new Error('Database error'));

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result.translation).toBe('jongen'); // Fallback translation
      expect(result.confidence).toBe(0.6);
      expect(result.source).toBe('fallback');
    });

    it('should handle exact meaning matches', async () => {
      const mockSearchResult = [
        {
          word: {
            id: '1',
            word: 'bruh',
            meaning: 'jongen, broer',
            example: 'Hey bruh, alles goed?',
            audio_url: null,
            difficulty: 'easy',
            category: 'general',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          relevance: 1.0,
          matchType: 'exact' as const,
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockSearchResult);

      const result = await TranslationService.translateText('jongen, broer', 'slang');

      expect(result.translation).toBe('bruh');
      expect(result.confidence).toBe(0.95);
      expect(result.source).toBe('database');
    });
  });

  describe('smartTranslate', () => {
    it('should translate to formal successfully', async () => {
      const mockSearchResult = [
        {
          word: {
            id: '1',
            word: 'bruh',
            meaning: 'jongen, broer',
            example: 'Hey bruh, alles goed?',
            audio_url: null,
            difficulty: 'easy',
            category: 'general',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          relevance: 1.0,
          matchType: 'exact' as const,
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockSearchResult);

      const result = await TranslationService.smartTranslate('bruh', 'to_formal');

      expect(result.translation).toBe('jongen, broer');
      expect(result.confidence).toBe(0.95);
      expect(result.source).toBe('database');
    });

    it('should translate to slang successfully', async () => {
      const mockSearchResult = [
        {
          word: {
            id: '1',
            word: 'bruh',
            meaning: 'jongen, broer',
            example: 'Hey bruh, alles goed?',
            audio_url: null,
            difficulty: 'easy',
            category: 'general',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          relevance: 1.0,
          matchType: 'exact' as const,
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockSearchResult);

      const result = await TranslationService.smartTranslate('jongen', 'to_slang');

      expect(result.translation).toBe('bruh');
      expect(result.confidence).toBe(0.95);
      expect(result.source).toBe('database');
    });

    it('should handle translation errors', async () => {
      mockWordService.searchWords.mockRejectedValue(new Error('Translation error'));

      await expect(TranslationService.smartTranslate('bruh', 'to_formal'))
        .rejects.toThrow('Translation error');
    });
  });

  describe('batchTranslate', () => {
    it('should translate multiple texts successfully', async () => {
      const mockSearchResult = [
        {
          word: {
            id: '1',
            word: 'bruh',
            meaning: 'jongen, broer',
            example: 'Hey bruh, alles goed?',
            audio_url: null,
            difficulty: 'easy',
            category: 'general',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          relevance: 1.0,
          matchType: 'exact' as const,
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockSearchResult);

      const result = await TranslationService.batchTranslate(['bruh', 'lit'], 'formal');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].translation).toBe('jongen, broer');
      expect(result.data![1].translation).toBe('jongen, broer');
    });

    it('should handle batch translation errors', async () => {
      mockWordService.searchWords.mockRejectedValue(new Error('Batch error'));

      const result = await TranslationService.batchTranslate(['bruh'], 'formal');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to translate batch');
    });

    it('should handle empty batch', async () => {
      const result = await TranslationService.batchTranslate([], 'formal');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedback = {
        original_text: 'bruh',
        translation: 'jongen',
        target: 'formal' as const,
        feedback: 'correct' as const,
        user_correction: null,
        notes: null,
      };

      const result = await TranslationService.submitFeedback(feedback);

      expect(result.success).toBe(true);
    });

    it('should handle feedback submission errors', async () => {
      const feedback = {
        original_text: 'bruh',
        translation: 'jongen',
        target: 'formal' as const,
        feedback: 'incorrect' as const,
        user_correction: 'broer',
        notes: 'Should be broer instead of jongen',
      };

      const result = await TranslationService.submitFeedback(feedback);

      expect(result.success).toBe(true);
    });
  });

  describe('getTranslationHistory', () => {
    it('should get translation history successfully', async () => {
      const result = await TranslationService.getTranslationHistory('user-1', 10);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle translation history errors', async () => {
      const result = await TranslationService.getTranslationHistory('invalid-user', 10);

      expect(result.success).toBe(false);
    });
  });

  describe('getFallbackTranslation', () => {
    it('should return fallback translation for known words', () => {
      const result = TranslationService.getFallbackTranslation('bruh', 'formal');
      expect(result).toBe('jongen');
    });

    it('should return fallback translation for formal to slang', () => {
      const result = TranslationService.getFallbackTranslation('jongen', 'slang');
      expect(result).toBe('bruh');
    });

    it('should return null for unknown words', () => {
      const result = TranslationService.getFallbackTranslation('unknown', 'formal');
      expect(result).toBeNull();
    });

    it('should handle case insensitive matching', () => {
      const result = TranslationService.getFallbackTranslation('BRUH', 'formal');
      expect(result).toBe('jongen');
    });
  });
});
