import { supabase } from './supabase';
import { NotificationService } from './notificationService';
import { Achievement, UserAchievement, UserStats, LevelInfo } from '@/types';

export interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  totalQuizScore: number;
  quizzesCompleted: number;
  achievementsUnlocked: number;
  currentLevel: number;
  experiencePoints: number;
  experienceToNextLevel: number;
}

export interface LevelInfo {
  level: number;
  name: string;
  minExperience: number;
  maxExperience: number;
  rewards: string[];
}

interface AchievementResponse {
  success: boolean;
  error?: string;
  data?: {
    newAchievements: Achievement[];
    totalExperienceGained: number;
  };
}

interface ExperienceResponse {
  success: boolean;
  error?: string;
  data?: {
    experience_points: number;
    level: number;
    levelUp: boolean;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  experienceReward: number;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export class GamificationService {
  private static instance: GamificationService;

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  // Experience and Leveling System
  async addExperience(userId: string, amount: number): Promise<ExperienceResponse> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('experience_points, level')
        .eq('id', userId)
        .single();

      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      const newExperience = profile.experience_points + amount;
      const newLevel = this.calculateLevel(newExperience);
      const levelUp = newLevel > profile.level;

      // Update user experience and level
      const { error } = await supabase
        .from('profiles')
        .update({
          experience_points: newExperience,
          level: newLevel,
        })
        .eq('id', userId);

      if (error) throw error;

      // Get updated stats
      const stats = await this.getUserStats(userId);
      
      // Send level up notification
      if (levelUp && stats.success) {
        await NotificationService.sendCustomNotification(
          'Level Up! 🎉',
          `Gefeliciteerd! Je bent nu level ${newLevel}!`,
          { type: 'LEVEL_UP', level: newLevel }
        );
      }

      return {
        success: true,
        data: {
          experience_points: newExperience,
          level: newLevel,
          levelUp,
        },
      };
    } catch (error) {
      console.error('Error adding experience:', error);
      return { success: false, error: 'Failed to add experience' };
    }
  }

  calculateLevel(experience: number): number {
    // Level calculation: each level requires more experience
    // Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
    let level = 1;
    let requiredXP = 100;
    let currentXP = experience;

    while (currentXP >= requiredXP) {
      currentXP -= requiredXP;
      level++;
      requiredXP = level * 100;
    }

    return level;
  }

  getLevelInfo(level: number): LevelInfo {
    const levelNames = [
      'Beginner',
      'Leerling',
      'Student',
      'Kennis',
      'Expert',
      'Master',
      'Guru',
      'Legende',
      'Mythic',
      'Godlike'
    ];

    const minXP = this.getMinExperienceForLevel(level);
    const maxXP = this.getMinExperienceForLevel(level + 1) - 1;

    const rewards = this.getLevelRewards(level);

    return {
      level,
      name: levelNames[level - 1] || `Level ${level}`,
      minExperience: minXP,
      maxExperience: maxXP,
      rewards,
    };
  }

  private getMinExperienceForLevel(level: number): number {
    if (level <= 1) return 0;
    return ((level - 1) * level * 50);
  }

  private getLevelRewards(level: number): string[] {
    const rewards: Record<number, string[]> = {
      1: ['Unlock basic words'],
      2: ['Unlock quiz feature'],
      3: ['Unlock achievements'],
      4: ['Unlock streak tracking'],
      5: ['Unlock advanced words'],
      6: ['Unlock community features'],
      7: ['Unlock custom themes'],
      8: ['Unlock premium content'],
      9: ['Unlock exclusive words'],
      10: ['Unlock all features'],
    };

    return rewards[level] || ['Level up reward'];
  }

  // Achievement System
  async checkAndAwardAchievements(userId: string): Promise<AchievementResponse> {
    try {
      const stats = await this.getUserStats(userId);
      if (!stats.success) return stats;

      const userStats = stats.data!;
      const newAchievements: Achievement[] = [];

      // Define achievements
      const achievements = [
        {
          id: 'first_word',
          name: 'Eerste Stap',
          description: 'Leer je eerste woord',
          condition: () => userStats.totalWordsLearned >= 1,
          experienceReward: 50,
        },
        {
          id: 'word_collector',
          name: 'Woord Verzamelaar',
          description: 'Leer 10 woorden',
          condition: () => userStats.totalWordsLearned >= 10,
          experienceReward: 100,
        },
        {
          id: 'word_master',
          name: 'Woord Meester',
          description: 'Leer 50 woorden',
          condition: () => userStats.totalWordsLearned >= 50,
          experienceReward: 250,
        },
        {
          id: 'streak_beginner',
          name: 'Streak Beginner',
          description: 'Behoud een streak van 3 dagen',
          condition: () => userStats.currentStreak >= 3,
          experienceReward: 75,
        },
        {
          id: 'streak_master',
          name: 'Streak Meester',
          description: 'Behoud een streak van 7 dagen',
          condition: () => userStats.currentStreak >= 7,
          experienceReward: 200,
        },
        {
          id: 'streak_legend',
          name: 'Streak Legende',
          description: 'Behoud een streak van 30 dagen',
          condition: () => userStats.currentStreak >= 30,
          experienceReward: 500,
        },
        {
          id: 'quiz_beginner',
          name: 'Quiz Beginner',
          description: 'Voltooi je eerste quiz',
          condition: () => userStats.quizzesCompleted >= 1,
          experienceReward: 50,
        },
        {
          id: 'quiz_expert',
          name: 'Quiz Expert',
          description: 'Voltooi 10 quizzen',
          condition: () => userStats.quizzesCompleted >= 10,
          experienceReward: 150,
        },
        {
          id: 'perfect_score',
          name: 'Perfecte Score',
          description: 'Behaal een perfecte score in een quiz',
          condition: () => userStats.totalQuizScore >= 100,
          experienceReward: 100,
        },
        {
          id: 'level_5',
          name: 'Level 5 Bereikt',
          description: 'Bereik level 5',
          condition: () => userStats.currentLevel >= 5,
          experienceReward: 300,
        },
        {
          id: 'level_10',
          name: 'Level 10 Bereikt',
          description: 'Bereik level 10',
          condition: () => userStats.currentLevel >= 10,
          experienceReward: 500,
        },
      ];

      // Check each achievement
      for (const achievement of achievements) {
        const isUnlocked = await this.isAchievementUnlocked(userId, achievement.id);
        
        if (!isUnlocked && achievement.condition()) {
          // Award achievement
          await this.awardAchievement(userId, achievement);
          newAchievements.push(achievement);
        }
      }

      return { success: true, data: { newAchievements, totalExperienceGained: 0 } }; // Placeholder for total experience gained
    } catch (error) {
      console.error('Error checking achievements:', error);
      return { success: false, error: 'Failed to check achievements' };
    }
  }

  async awardAchievement(userId: string, achievement: Achievement): Promise<void> {
    try {
      // Add achievement to user's achievements
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });

      // Add experience reward
      await this.addExperience(userId, achievement.experienceReward);

      // Send notification
      await NotificationService.sendAchievementNotification(achievement.name);
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  async isAchievementUnlocked(userId: string, achievementId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
        .single();

    return !!data;
  }

  async getUserAchievements(userId: string): Promise<{ success: boolean; data?: UserAchievement[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return { success: false, error: 'Failed to get achievements' };
    }
  }

  // Stats and Progress Tracking
  async getUserStats(userId: string): Promise<{ success: boolean; data?: UserStats; error?: string }> {
    try {
      // Get basic profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('experience_points, level')
        .eq('id', userId)
        .single();

      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      // Get word progress
      const { data: wordProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      // Get quiz sessions
      const { data: quizSessions } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId);

      // Calculate stats
      const totalWordsLearned = wordProgress?.filter(wp => wp.mastery_level >= 3).length || 0;
      const currentStreak = this.calculateCurrentStreak(wordProgress || []);
      const longestStreak = profile.longest_streak || 0;
      const totalQuizScore = quizSessions?.reduce((sum, qs) => sum + (qs.score || 0), 0) || 0;
      const quizzesCompleted = quizSessions?.length || 0;

      // Get achievement count
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId);

      const achievementsUnlocked = achievements?.length || 0;

      // Calculate level info
      const levelInfo = this.getLevelInfo(profile.level);
      const experienceToNextLevel = levelInfo.maxExperience - profile.experience_points + 1;

      const stats: UserStats = {
        totalWordsLearned,
        currentStreak,
        longestStreak,
        totalQuizScore,
        quizzesCompleted,
        achievementsUnlocked,
        currentLevel: profile.level,
        experiencePoints: profile.experience_points,
        experienceToNextLevel,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { success: false, error: 'Failed to get user stats' };
    }
  }

  private calculateCurrentStreak(wordProgress: any[]): number { // Changed UserProgress to any[]
    if (!wordProgress.length) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    const currentDate = new Date(today);

    while (true) {
      const hasActivity = wordProgress.some(wp => {
        const wpDate = new Date(wp.last_reviewed_at || '');
        wpDate.setHours(0, 0, 0, 0);
        return wpDate.getTime() === currentDate.getTime();
      });

      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // Word Learning Progress
  async updateWordProgress(
    userId: string,
    wordId: string,
    masteryLevel: number
  ): Promise<any> { // Changed ApiResponse to any for now
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          word_id: wordId,
          mastery_level: masteryLevel,
          last_reviewed_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Add experience based on mastery level
      const experienceReward = masteryLevel * 10;
      await this.addExperience(userId, experienceReward);

      // Check for achievements
      await this.checkAndAwardAchievements(userId);

      return { success: true };
    } catch (error) {
      console.error('Error updating word progress:', error);
      return { success: false, error: 'Failed to update word progress' };
    }
  }

  // Quiz Completion
  async completeQuiz(
    userId: string,
    quizId: string,
    score: number,
    totalQuestions: number
  ): Promise<any> { // Changed ApiResponse to any for now
    try {
      // Save quiz session
      const { error } = await supabase
        .from('quiz_sessions')
        .insert({
          user_id: userId,
          quiz_id: quizId,
          score,
          total_questions: totalQuestions,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Calculate experience reward
      const accuracy = score / totalQuestions;
      const baseExperience = 50;
      const bonusExperience = Math.floor(accuracy * 50);
      const totalExperience = baseExperience + bonusExperience;

      await this.addExperience(userId, totalExperience);

      // Check for achievements
      await this.checkAndAwardAchievements(userId);

      return { success: true };
    } catch (error) {
      console.error('Error completing quiz:', error);
      return { success: false, error: 'Failed to complete quiz' };
    }
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10): Promise<any> { // Changed ApiResponse to any for now
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          level,
          experience_points,
          total_words_learned,
          current_streak
        `)
        .order('experience_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return { success: false, error: 'Failed to get leaderboard' };
    }
  }

  // Daily Challenges (simplified - no database table)
  async getDailyChallenge(userId: string): Promise<any> { // Changed ApiResponse to any for now
    try {
      // Generate a simple daily challenge without database storage
      const challengeTypes = ['learn_words', 'complete_quiz', 'maintain_streak'];
      const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)] || 'learn_words';
      
      const newChallenge = {
        id: `challenge_${Date.now()}`,
        user_id: userId,
        type: randomType,
        target: this.getChallengeTarget(randomType),
        date: new Date().toISOString().split('T')[0],
        completed: false,
      };

      return { success: true, data: newChallenge };
    } catch (error) {
      console.error('Error getting daily challenge:', error);
      return { success: false, error: 'Failed to get daily challenge' };
    }
  }

  private getChallengeTarget(type: string): number {
    const targets: Record<string, number> = {
      learn_words: Math.floor(Math.random() * 5) + 3, // 3-7 words
      complete_quiz: 1,
      maintain_streak: Math.floor(Math.random() * 3) + 2, // 2-4 days
    };
    return targets[type] || 1;
  }
}

export default GamificationService.getInstance();