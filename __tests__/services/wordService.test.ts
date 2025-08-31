import { WordService } from '@/services/wordService';
import { supabase } from '@/services/supabase';

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('WordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchWords', () => {
    it('should search words successfully', async () => {
      const mockWords = [
        {
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
      ];

      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: mockWords, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.searchWords('bruh', 5);

      expect(mockSupabase.from).toHaveBeenCalledWith('slang_words');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toHaveLength(1);
      expect(result[0].word.word).toBe('bruh');
      expect(result[0].relevance).toBe(1.0);
      expect(result[0].matchType).toBe('exact');
    });

    it('should handle empty search results', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.searchWords('nonexistent', 5);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.searchWords('test', 5);

      expect(result).toHaveLength(0);
    });

    it('should calculate relevance scores correctly', async () => {
      const mockWords = [
        {
          id: '1',
          word: 'bruh',
          meaning: 'jongen',
          example: null,
          audio_url: null,
          difficulty: 'easy',
          category: 'general',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          word: 'brother',
          meaning: 'broer',
          example: null,
          audio_url: null,
          difficulty: 'medium',
          category: 'general',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: mockWords, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.searchWords('bruh', 5);

      expect(result[0].relevance).toBe(1.0); // Exact match
      expect(result[0].matchType).toBe('exact');
      expect(result[1].relevance).toBe(0.3); // Fuzzy match
      expect(result[1].matchType).toBe('fuzzy');
    });
  });

  describe('getWordOfTheDay', () => {
    it('should get word of the day successfully', async () => {
      const mockWordOfDay = {
        id: '1',
        word_id: 'word-1',
        word: 'lit',
        definition: 'geweldig, fantastisch',
        example: 'Die nieuwe sneakers zijn echt lit!',
        scheduled_date: '2024-01-01',
        date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockWordOfDay, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.getWordOfTheDay();

      expect(mockSupabase.from).toHaveBeenCalledWith('word_of_the_day');
      expect(result.success).toBe(true);
      expect(result.data?.word).toBe('lit');
    });

    it('should handle no word of the day found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.getWordOfTheDay();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No word of the day found');
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.getWordOfTheDay();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getUserWordProgress', () => {
    it('should get user word progress successfully', async () => {
      const mockProgress = [
        {
          id: '1',
          user_id: 'user-1',
          word_id: 'word-1',
          learned_at: '2024-01-01T00:00:00Z',
          quiz_score: 100,
          times_reviewed: 3,
          last_reviewed: '2024-01-01T00:00:00Z',
          is_favorite: true,
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockProgress, error: null }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.getUserWordProgress('user-1', 10);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_progress');
      expect(result).toHaveLength(1);
      expect(result[0].word_id).toBe('word-1');
      expect(result[0].quiz_score).toBe(100);
    });

    it('should handle empty progress', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.getUserWordProgress('user-1', 10);

      expect(result).toHaveLength(0);
    });
  });

  describe('addToFavorites', () => {
    it('should add word to favorites successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await WordService.addToFavorites('user-1', 'word-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_progress');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        word_id: 'word-1',
        is_favorite: true,
      });
      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await WordService.addToFavorites('user-1', 'word-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove word from favorites successfully', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await WordService.removeFromFavorites('user-1', 'word-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_progress');
      expect(mockUpdate).toHaveBeenCalledWith({ is_favorite: false });
      expect(result.success).toBe(true);
    });
  });

  describe('isFavorite', () => {
    it('should check if word is favorite successfully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { is_favorite: true }, 
              error: null 
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.isFavorite('user-1', 'word-1');

      expect(result).toBe(true);
    });

    it('should return false when word is not favorite', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { is_favorite: false }, 
              error: null 
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await WordService.isFavorite('user-1', 'word-1');

      expect(result).toBe(false);
    });
  });
});
