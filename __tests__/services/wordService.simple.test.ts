import { WordService } from '@/services/wordService';

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe('WordService - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchWords', () => {
    it('should handle empty search results', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const mockSupabase = require('@/services/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await WordService.searchWords('nonexistent', 5);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          }),
        }),
      });

      const mockSupabase = require('@/services/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await WordService.searchWords('test', 5);

      expect(result).toHaveLength(0);
    });
  });

  describe('getWordOfTheDay', () => {
    it('should handle no word of the day found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const mockSupabase = require('@/services/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await WordService.getWordOfTheDay();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No word of the day found');
    });
  });
});
