import GamificationService from '@/services/gamificationService';
import { supabase } from '@/services/supabase';


// Mock dependencies
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/services/notificationService', () => ({
  sendCustomNotification: jest.fn(),
  sendAchievementNotification: jest.fn(),
}));

describe('GamificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addExperience', () => {
    it('should add experience and level up successfully', async () => {
      const mockProfile = {
        experience_points: 50,
        level: 1,
      };

      const mockUpdatedProfile = {
        experience_points: 150,
        level: 2,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null }),
        }),
      });

      const result = await GamificationService.addExperience('user-1', 100);

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle user profile not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const result = await GamificationService.addExperience('user-1', 100);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User profile not found');
    });
  });

  describe('calculateLevel', () => {
    it('should calculate level 1 for 0-99 experience', () => {
      expect(GamificationService.calculateLevel(0)).toBe(1);
      expect(GamificationService.calculateLevel(50)).toBe(1);
      expect(GamificationService.calculateLevel(99)).toBe(1);
    });

    it('should calculate level 2 for 100-299 experience', () => {
      expect(GamificationService.calculateLevel(100)).toBe(2);
      expect(GamificationService.calculateLevel(200)).toBe(2);
      expect(GamificationService.calculateLevel(299)).toBe(2);
    });

    it('should calculate level 3 for 300-599 experience', () => {
      expect(GamificationService.calculateLevel(300)).toBe(3);
      expect(GamificationService.calculateLevel(450)).toBe(3);
      expect(GamificationService.calculateLevel(599)).toBe(3);
    });
  });

  describe('getLevelInfo', () => {
    it('should return correct level info for level 1', () => {
      const levelInfo = GamificationService.getLevelInfo(1);

      expect(levelInfo.level).toBe(1);
      expect(levelInfo.name).toBe('Beginner');
      expect(levelInfo.minExperience).toBe(0);
      expect(levelInfo.maxExperience).toBe(99);
      expect(levelInfo.rewards).toContain('Unlock basic words');
    });

    it('should return correct level info for level 5', () => {
      const levelInfo = GamificationService.getLevelInfo(5);

      expect(levelInfo.level).toBe(5);
      expect(levelInfo.name).toBe('Expert');
      expect(levelInfo.rewards).toContain('Unlock advanced words');
    });
  });

  describe('checkAndAwardAchievements', () => {
    it('should award first word achievement', async () => {
      const mockStats = {
        totalWordsLearned: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalQuizScore: 0,
        quizzesCompleted: 0,
        achievementsUnlocked: 0,
        currentLevel: 1,
        experiencePoints: 0,
        experienceToNextLevel: 100,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock getUserStats to return stats that would trigger achievement
      jest.spyOn(GamificationService, 'getUserStats').mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const result = await GamificationService.checkAndAwardAchievements('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.id).toBe('first_word');
    });

    it('should not award achievement if already unlocked', async () => {
      const mockStats = {
        totalWordsLearned: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalQuizScore: 0,
        quizzesCompleted: 0,
        achievementsUnlocked: 0,
        currentLevel: 1,
        experiencePoints: 0,
        experienceToNextLevel: 100,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
          }),
        }),
      });

      jest.spyOn(GamificationService, 'getUserStats').mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const result = await GamificationService.checkAndAwardAchievements('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getUserStats', () => {
    it('should return user stats successfully', async () => {
      const mockProfile = {
        experience_points: 150,
        level: 2,
        longest_streak: 5,
      };

      const mockWordProgress = [
        {
          id: '1',
          user_id: 'user-1',
          word_id: 'word-1',
          mastery_level: 3,
          last_practiced: '2024-01-01T00:00:00Z',
        },
      ];

      const mockQuizSessions = [
        {
          id: '1',
          user_id: 'user-1',
          quiz_id: 'quiz-1',
          score: 80,
          total_questions: 10,
          completed_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockAchievements = [
        { id: '1' },
        { id: '2' },
      ];

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              mockResolvedValue: jest.fn().mockResolvedValue({ data: mockWordProgress, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              mockResolvedValue: jest.fn().mockResolvedValue({ data: mockQuizSessions, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              mockResolvedValue: jest.fn().mockResolvedValue({ data: mockAchievements, error: null }),
            }),
          }),
        });

      const result = await GamificationService.getUserStats('user-1');

      expect(result.success).toBe(true);
      expect(result.data?.currentLevel).toBe(2);
      expect(result.data?.experiencePoints).toBe(150);
      expect(result.data?.totalWordsLearned).toBe(1);
      expect(result.data?.quizzesCompleted).toBe(1);
      expect(result.data?.achievementsUnlocked).toBe(2);
    });

    it('should handle user profile not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const result = await GamificationService.getUserStats('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User profile not found');
    });
  });

  describe('updateWordProgress', () => {
    it('should update word progress successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await GamificationService.updateWordProgress('user-1', 'word-1', 3);

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('user_word_progress');
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Update failed');

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockRejectedValue(mockError),
      });

      const result = await GamificationService.updateWordProgress('user-1', 'word-1', 3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update word progress');
    });
  });

  describe('completeQuiz', () => {
    it('should complete quiz successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await GamificationService.completeQuiz('user-1', 'quiz-1', 8, 10);

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('quiz_sessions');
    });

    it('should handle quiz completion errors', async () => {
      const mockError = new Error('Insert failed');

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockRejectedValue(mockError),
      });

      const result = await GamificationService.completeQuiz('user-1', 'quiz-1', 8, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to complete quiz');
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard successfully', async () => {
      const mockLeaderboard = [
        {
          id: 'user-1',
          username: 'testuser',
          level: 5,
          experience_points: 1000,
          total_words_learned: 50,
          current_streak: 10,
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockLeaderboard, error: null }),
          }),
        }),
      });

      const result = await GamificationService.getLeaderboard(10);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLeaderboard);
    });

    it('should handle leaderboard retrieval errors', async () => {
      const mockError = new Error('Query failed');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(mockError),
          }),
        }),
      });

      const result = await GamificationService.getLeaderboard(10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get leaderboard');
    });
  });

  describe('getDailyChallenge', () => {
    it('should return existing daily challenge', async () => {
      const mockChallenge = {
        id: '1',
        user_id: 'user-1',
        date: '2024-01-01',
        type: 'learn_words',
        target: 5,
        completed: false,
        progress: 0,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
            }),
          }),
        }),
      });

      const result = await GamificationService.getDailyChallenge('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChallenge);
    });

    it('should create new daily challenge if none exists', async () => {
      const mockChallenge = {
        id: '1',
        user_id: 'user-1',
        date: '2024-01-01',
        type: 'learn_words',
        target: 5,
        completed: false,
        progress: 0,
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
            }),
          }),
        });

      const result = await GamificationService.getDailyChallenge('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChallenge);
    });
  });
});
