import { QuizService } from '@/services/quizService';
import { WordService } from '@/services/wordService';

// Mock WordService
jest.mock('@/services/wordService', () => ({
  WordService: {
    searchWords: jest.fn(),
    getUserWordProgress: jest.fn(),
  },
}));

const mockWordService = WordService as jest.Mocked<typeof WordService>;

describe('QuizService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQuiz', () => {
    it('should generate a quiz successfully', async () => {
      const mockWords = [
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
        {
          word: {
            id: '2',
            word: 'lit',
            meaning: 'geweldig, fantastisch',
            example: 'Die nieuwe sneakers zijn echt lit!',
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

      mockWordService.searchWords.mockResolvedValue(mockWords);

      const result = await QuizService.generateQuiz('easy', 5);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      expect(result.data![0]).toHaveProperty('question');
      expect(result.data![0]).toHaveProperty('options');
      expect(result.data![0]).toHaveProperty('correctAnswer');
      expect(result.data![0]).toHaveProperty('explanation');
    });

    it('should handle insufficient words for quiz', async () => {
      mockWordService.searchWords.mockResolvedValue([]);

      const result = await QuizService.generateQuiz('easy', 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient words available for quiz');
    });

    it('should handle database errors', async () => {
      mockWordService.searchWords.mockRejectedValue(new Error('Database error'));

      const result = await QuizService.generateQuiz('easy', 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate quiz');
    });

    it('should generate different question types', async () => {
      const mockWords = [
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

      mockWordService.searchWords.mockResolvedValue(mockWords);

      const result = await QuizService.generateQuiz('easy', 1);

      expect(result.success).toBe(true);
      expect(result.data![0].questionType).toBeDefined();
    });
  });

  describe('generatePersonalizedQuiz', () => {
    it('should generate personalized quiz based on user progress', async () => {
      const mockWords = [
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

      const mockProgress = [
        {
          id: '1',
          user_id: 'user-1',
          word_id: 'word-1',
          learned_at: '2024-01-01T00:00:00Z',
          quiz_score: 80,
          times_reviewed: 2,
          last_reviewed: '2024-01-01T00:00:00Z',
          is_favorite: false,
        },
      ];

      mockWordService.searchWords.mockResolvedValue(mockWords);
      mockWordService.getUserWordProgress.mockResolvedValue(mockProgress);

      const result = await QuizService.generatePersonalizedQuiz('user-1', 5);

      expect(result.success).toBe(true);
      expect(mockWordService.getUserWordProgress).toHaveBeenCalledWith('user-1', 50);
    });

    it('should handle user with no progress', async () => {
      mockWordService.getUserWordProgress.mockResolvedValue([]);

      const result = await QuizService.generatePersonalizedQuiz('user-1', 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No learning progress found. Start with a regular quiz!');
    });
  });

  describe('submitQuizAnswer', () => {
    it('should submit quiz answer successfully', async () => {
      const answer = {
        user_id: 'user-1',
        quiz_id: 'quiz-1',
        question_id: 'question-1',
        selected_answer: 'jongen, broer',
        is_correct: true,
        time_taken: 5.2,
        question_type: 'slang_to_formal' as const,
      };

      const result = await QuizService.submitQuizAnswer(answer);

      expect(result.success).toBe(true);
    });

    it('should handle answer submission errors', async () => {
      const answer = {
        user_id: 'user-1',
        quiz_id: 'quiz-1',
        question_id: 'question-1',
        selected_answer: 'wrong answer',
        is_correct: false,
        time_taken: 10.5,
        question_type: 'slang_to_formal' as const,
      };

      const result = await QuizService.submitQuizAnswer(answer);

      expect(result.success).toBe(true);
    });
  });

  describe('getQuizResults', () => {
    it('should get quiz results successfully', async () => {
      const result = await QuizService.getQuizResults('user-1', 'quiz-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('score');
      expect(result.data).toHaveProperty('totalQuestions');
      expect(result.data).toHaveProperty('correctAnswers');
      expect(result.data).toHaveProperty('timeSpent');
    });

    it('should handle quiz results not found', async () => {
      const result = await QuizService.getQuizResults('user-1', 'nonexistent-quiz');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quiz results not found');
    });
  });

  describe('getUserQuizStats', () => {
    it('should get user quiz statistics successfully', async () => {
      const result = await QuizService.getUserQuizStats('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalQuizzes');
      expect(result.data).toHaveProperty('averageScore');
      expect(result.data).toHaveProperty('bestScore');
      expect(result.data).toHaveProperty('totalTimeSpent');
    });

    it('should handle user with no quiz history', async () => {
      const result = await QuizService.getUserQuizStats('new-user');

      expect(result.success).toBe(true);
      expect(result.data?.totalQuizzes).toBe(0);
    });
  });

  describe('getQuizLeaderboard', () => {
    it('should get quiz leaderboard successfully', async () => {
      const result = await QuizService.getQuizLeaderboard(10);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      if (result.data && result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('user_id');
        expect(result.data[0]).toHaveProperty('username');
        expect(result.data[0]).toHaveProperty('score');
        expect(result.data[0]).toHaveProperty('rank');
      }
    });

    it('should limit leaderboard results', async () => {
      const result = await QuizService.getQuizLeaderboard(5);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('createQuizQuestion', () => {
    it('should create slang to formal question', () => {
      const word = {
        id: '1',
        word: 'bruh',
        meaning: 'jongen, broer',
        example: 'Hey bruh, alles goed?',
        audio_url: null,
        difficulty: 'easy',
        category: 'general',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const options = ['jongen', 'broer', 'vriend', 'man'];

      const question = QuizService.createQuizQuestion(word, options, 'slang_to_formal');

      expect(question.questionType).toBe('slang_to_formal');
      expect(question.question).toContain('bruh');
      expect(question.options).toContain('jongen, broer');
      expect(question.correctAnswer).toBe('jongen, broer');
      expect(question.explanation).toContain('bruh');
    });

    it('should create formal to slang question', () => {
      const word = {
        id: '1',
        word: 'bruh',
        meaning: 'jongen, broer',
        example: 'Hey bruh, alles goed?',
        audio_url: null,
        difficulty: 'easy',
        category: 'general',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const options = ['bruh', 'bro', 'dude', 'man'];

      const question = QuizService.createQuizQuestion(word, options, 'formal_to_slang');

      expect(question.questionType).toBe('formal_to_slang');
      expect(question.question).toContain('jongen, broer');
      expect(question.options).toContain('bruh');
      expect(question.correctAnswer).toBe('bruh');
    });

    it('should create example completion question', () => {
      const word = {
        id: '1',
        word: 'bruh',
        meaning: 'jongen, broer',
        example: 'Hey bruh, alles goed?',
        audio_url: null,
        difficulty: 'easy',
        category: 'general',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const options = ['bruh', 'bro', 'dude', 'man'];

      const question = QuizService.createQuizQuestion(word, options, 'example_completion');

      expect(question.questionType).toBe('example_completion');
      expect(question.question).toContain('Hey ___');
      expect(question.options).toContain('bruh');
      expect(question.correctAnswer).toBe('bruh');
    });
  });

  describe('generateDistractors', () => {
    it('should generate distractors from word pool', () => {
      const wordPool = [
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
        {
          word: {
            id: '2',
            word: 'lit',
            meaning: 'geweldig, fantastisch',
            example: 'Die nieuwe sneakers zijn echt lit!',
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

      const correctAnswer = 'jongen, broer';
      const distractors = QuizService.generateDistractors(wordPool, correctAnswer, 3);

      expect(distractors).toHaveLength(3);
      expect(distractors).not.toContain(correctAnswer);
    });

    it('should handle insufficient word pool for distractors', () => {
      const wordPool = [
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

      const correctAnswer = 'jongen, broer';
      const distractors = QuizService.generateDistractors(wordPool, correctAnswer, 3);

      expect(distractors.length).toBeLessThanOrEqual(3);
    });
  });

  describe('calculateQuizScore', () => {
    it('should calculate quiz score correctly', () => {
      const answers = [
        { is_correct: true, time_taken: 5.0 },
        { is_correct: true, time_taken: 3.0 },
        { is_correct: false, time_taken: 10.0 },
        { is_correct: true, time_taken: 7.0 },
      ];

      const score = QuizService.calculateQuizScore(answers);

      expect(score).toBe(75); // 3 correct out of 4 = 75%
    });

    it('should handle empty answers', () => {
      const answers: any[] = [];
      const score = QuizService.calculateQuizScore(answers);

      expect(score).toBe(0);
    });

    it('should handle all correct answers', () => {
      const answers = [
        { is_correct: true, time_taken: 5.0 },
        { is_correct: true, time_taken: 3.0 },
        { is_correct: true, time_taken: 7.0 },
      ];

      const score = QuizService.calculateQuizScore(answers);

      expect(score).toBe(100);
    });
  });
});
