import { WordService } from '../../services/wordService';
import { supabase } from '../../services/supabase';

// Mock Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('WordService - Simple Tests', () => {
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
          example: 'Bruh, dat is echt niet cool.',
          audio_url: null,
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
  });

  describe('getWordById', () => {
    it('should return word by id successfully', async () => {
      const mockWord = {
        id: '1',
        word: 'bruh',
        meaning: 'jongen',
        category: 'general',
        difficulty: 'easy',
        example: 'Bruh, dat is echt niet cool.',
        audio_url: null,
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
  });
});
