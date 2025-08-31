import { TranslationService } from '@/services/translationService';

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock WordService
jest.mock('@/services/wordService', () => ({
  WordService: {
    searchWords: jest.fn(),
  },
}));

describe('TranslationService', () => {
  const mockSupabase = require('@/services/supabase').supabase;
  const mockWordService = require('@/services/wordService').WordService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('translateText', () => {
    it('should use AI translation when available', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token-123',
      };

      const mockAIResponse = {
        translation: 'jongen',
        confidence: 0.85,
        source: 'ai',
        model: 'gpt-4',
        explanation: 'AI translation using GPT-4',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockAIResponse,
        error: null,
      });

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('translate-text', {
        body: {
          text: 'bruh',
          target: 'formal',
          context: undefined,
          userId: 'user-123',
        },
        headers: {
          Authorization: 'Bearer token-123',
        },
      });

      expect(result).toEqual(mockAIResponse);
    });

    it('should fallback to database when AI fails', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token-123',
      };

      const mockDatabaseResult = [
        {
          word: { word: 'bruh', meaning: 'jongen' },
          relevance: 1.0,
          matchType: 'exact',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'AI service unavailable' },
      });

      mockWordService.searchWords.mockResolvedValue(mockDatabaseResult);

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result).toEqual({
        translation: 'jongen',
        confidence: 0.95,
        alternatives: ['jongen'],
        explanation: 'Found in database: bruh → jongen',
        source: 'database',
      });
    });

    it('should handle authentication errors gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' },
      });

      const mockDatabaseResult = [
        {
          word: { word: 'bruh', meaning: 'jongen' },
          relevance: 1.0,
          matchType: 'exact',
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockDatabaseResult);

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result.source).toBe('database');
      expect(result.translation).toBe('jongen');
    });
  });

  describe('smartTranslate', () => {
    it('should translate slang to formal', async () => {
      const mockAIResponse = {
        translation: 'jongen',
        confidence: 0.85,
        source: 'ai',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' }, access_token: 'token-123' } },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockAIResponse,
        error: null,
      });

      const result = await TranslationService.smartTranslate('bruh', 'to_formal');

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('translate-text', {
        body: {
          text: 'bruh',
          target: 'formal',
          context: undefined,
          userId: 'user-123',
        },
        headers: {
          Authorization: 'Bearer token-123',
        },
      });

      expect(result).toEqual(mockAIResponse);
    });

    it('should translate formal to slang', async () => {
      const mockAIResponse = {
        translation: 'bruh',
        confidence: 0.85,
        source: 'ai',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' }, access_token: 'token-123' } },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockAIResponse,
        error: null,
      });

      const result = await TranslationService.smartTranslate('jongen', 'to_slang');

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('translate-text', {
        body: {
          text: 'jongen',
          target: 'slang',
          context: undefined,
          userId: 'user-123',
        },
        headers: {
          Authorization: 'Bearer token-123',
        },
      });

      expect(result).toEqual(mockAIResponse);
    });
  });

  describe('batchTranslate', () => {
    it('should translate multiple words successfully', async () => {
      const mockAIResponse = {
        translation: 'jongen',
        confidence: 0.85,
        source: 'ai',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' }, access_token: 'token-123' } },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockAIResponse,
        error: null,
      });

      const result = await TranslationService.batchTranslate(['bruh', 'cap'], 'formal');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(mockAIResponse);
      expect(result.data[1]).toEqual(mockAIResponse);
    });

    it('should handle partial failures in batch translation', async () => {
      const mockAIResponse = {
        translation: 'jongen',
        confidence: 0.85,
        source: 'ai',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' }, access_token: 'token-123' } },
        error: null,
      });

      // First call succeeds, second fails
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: mockAIResponse,
          error: null,
        })
        .mockRejectedValueOnce(new Error('AI service error'));

      const result = await TranslationService.batchTranslate(['bruh', 'cap'], 'formal');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(mockAIResponse);
      expect(result.data[1].source).toBe('fallback');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token-123',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const feedback = {
        original_text: 'bruh',
        translation: 'jongen',
        target: 'formal' as const,
        feedback: 'correct' as const,
      };

      const result = await TranslationService.submitFeedback(feedback);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('translation_feedback');
    });

    it('should handle feedback submission errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' },
      });

      const feedback = {
        original_text: 'bruh',
        translation: 'jongen',
        target: 'formal' as const,
        feedback: 'correct' as const,
      };

      const result = await TranslationService.submitFeedback(feedback);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('getTranslationHistory', () => {
    it('should get translation history successfully', async () => {
      const mockHistory = [
        {
          id: '1',
          original_text: 'bruh',
          translation: 'jongen',
          target_language: 'formal',
          source: 'ai',
          confidence: 0.85,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockHistory,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await TranslationService.getTranslationHistory('user-123', 10);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });
  });

  describe('getTranslationStats', () => {
    it('should get translation statistics successfully', async () => {
      const mockLogs = [
        {
          original_text: 'bruh',
          source: 'ai',
          confidence: 0.85,
        },
        {
          original_text: 'cap',
          source: 'database',
          confidence: 0.95,
        },
        {
          original_text: 'bruh',
          source: 'fallback',
          confidence: 0.6,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockLogs,
            error: null,
          }),
        }),
      });

      const result = await TranslationService.getTranslationStats('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalTranslations: 3,
        aiTranslations: 1,
        databaseTranslations: 1,
        fallbackTranslations: 1,
        averageConfidence: 0.8,
        mostTranslatedWords: [
          { word: 'bruh', count: 2 },
          { word: 'cap', count: 1 },
        ],
      });
    });
  });

  describe('fallback translation', () => {
    it('should use rule-based fallback when no AI or database results', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' },
      });

      mockWordService.searchWords.mockResolvedValue([]);

      const result = await TranslationService.translateText('bruh', 'formal');

      expect(result.source).toBe('fallback');
      expect(result.translation).toBe('jongen');
      expect(result.confidence).toBe(0.6);
    });

    it('should return original text with low confidence when no translation found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' },
      });

      mockWordService.searchWords.mockResolvedValue([]);

      const result = await TranslationService.translateText('unknownword', 'formal');

      expect(result.source).toBe('fallback');
      expect(result.translation).toBe('unknownword');
      expect(result.confidence).toBe(0.1);
    });
  });
});
