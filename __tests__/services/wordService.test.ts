import { WordService } from '@/services/wordService';
import { supabase } from '@/services/supabase';

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('WordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWords', () => {
    it('should return words successfully', async () => {
      const mockWords = [
        {
          id: '1',
          word: 'bruh',
          meaning: 'jongen',
          category: 'general',
          difficulty: 'easy',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSupabaseResponse = {
        data: mockWords,
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

      const result = await WordService.getWords({ limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.data).toEqual(mockWords);
      expect(supabase.from).toHaveBeenCalledWith('slang_words');
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockRejectedValue(mockError),
            }),
          }),
        }),
      });

      const result = await WordService.getWords({ limit: 10 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch words');
    });

    it('should apply category filter', async () => {
      const mockSupabaseResponse = {
        data: [],
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

      await WordService.getWords({ category: 'gaming', limit: 10 });

      expect(supabase.from).toHaveBeenCalledWith('slang_words');
    });
  });

  describe('getWordById', () => {
    it('should return word by id successfully', async () => {
      const mockWord = {
        id: '1',
        word: 'bruh',
        meaning: 'jongen',
        category: 'general',
        difficulty: 'easy',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSupabaseResponse = {
        data: mockWord,
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockSupabaseResponse),
          }),
        }),
      });

      const result = await WordService.getWordById('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWord);
    });

    it('should handle word not found', async () => {
      const mockSupabaseResponse = {
        data: null,
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockSupabaseResponse),
          }),
        }),
      });

      const result = await WordService.getWordById('999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word not found');
    });
  });

  describe('searchWords', () => {
    it('should search words successfully', async () => {
      const mockWords = [
        {
          id: '1',
          word: 'bruh',
          meaning: 'jongen',
          category: 'general',
          difficulty: 'easy',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSupabaseResponse = {
        data: mockWords,
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockSupabaseResponse),
          }),
        }),
      });

      const result = await WordService.searchWords('bruh', 10);

      expect(result).toEqual(mockWords);
    });

    it('should handle empty search query', async () => {
      const result = await WordService.searchWords('', 10);

      expect(result).toEqual([]);
    });
  });

  describe('getWordOfTheDay', () => {
    it('should return word of the day successfully', async () => {
      const mockWord = {
        id: '1',
        word: 'bruh',
        meaning: 'jongen',
        category: 'general',
        difficulty: 'easy',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSupabaseResponse = {
        data: mockWord,
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockSupabaseResponse),
          }),
        }),
      });

      const result = await WordService.getWordOfTheDay();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWord);
    });
  });

  describe('getUserWordProgress', () => {
    it('should return user word progress successfully', async () => {
      const mockProgress = {
        id: '1',
        user_id: 'user-1',
        word_id: 'word-1',
        mastery_level: 3,
        times_reviewed: 5,
        correct_answers: 4,
        incorrect_answers: 1,
        last_reviewed_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSupabaseResponse = {
        data: [mockProgress],
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

      const result = await WordService.getUserWordProgress('user-1', 10);

      expect(result).toEqual([mockProgress]);
    });
  });

  describe('updateWordProgress', () => {
    it('should update word progress successfully', async () => {
      const mockSupabaseResponse = {
        data: null,
        error: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue(mockSupabaseResponse),
      });

      const result = await WordService.updateWordProgress('user-1', 'word-1', { mastery_level: 3 });

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('user_progress');
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Update failed');

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockRejectedValue(mockError),
      });

      const result = await WordService.updateWordProgress('user-1', 'word-1', { mastery_level: 3 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update word progress');
    });
  });
});
