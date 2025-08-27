import { supabase } from './supabase';
import { Tables } from '@/src/lib/types/database.types';

export type Profile = Tables<'profiles'>;

export interface PointsTransaction {
  userId: string;
  points: number;
  reason: string;
  activityType: 'word_of_day' | 'quiz_completed' | 'word_searched' | 'contribution_approved';
}

export interface LevelInfo {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
}

export class GamificationService {
  /**
   * Award points to user
   */
  static async awardPoints(transaction: PointsTransaction): Promise<Profile> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', transaction.userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      const currentPoints = profile.total_points || 0;
      const newTotalPoints = currentPoints + transaction.points;
      const newLevel = this.calculateLevel(newTotalPoints);

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          total_points: newTotalPoints,
          level: newLevel,
        })
        .eq('id', transaction.userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        throw updateError;
      }

      // Log the points transaction (optional - could add a points_log table)
      console.log(`Awarded ${transaction.points} points to user ${transaction.userId} for ${transaction.reason}`);

      return updatedProfile;
    } catch (error) {
      console.error('GamificationService.awardPoints error:', error);
      throw error;
    }
  }

  /**
   * Calculate level based on total points
   */
  static calculateLevel(points: number): number {
    // Level progression: 0-49(1), 50-199(2), 200-499(3), 500-999(4), 1000+(5)
    if (points < 50) return 1;
    if (points < 200) return 2;
    if (points < 500) return 3;
    if (points < 1000) return 4;
    return 5;
  }

  /**
   * Get level information
   */
  static getLevelInfo(level: number): LevelInfo {
    const levels: LevelInfo[] = [
      { level: 1, name: 'Nieuweling', minPoints: 0, maxPoints: 49, icon: '🌱' },
      { level: 2, name: 'Leerling', minPoints: 50, maxPoints: 199, icon: '📚' },
      { level: 3, name: 'Kenner', minPoints: 200, maxPoints: 499, icon: '🎓' },
      { level: 4, name: 'Expert', minPoints: 500, maxPoints: 999, icon: '🏆' },
      { level: 5, name: 'Meester', minPoints: 1000, maxPoints: Infinity, icon: '👑' },
    ];

    return levels.find(l => l.level === level) || levels[0];
  }

  /**
   * Update daily streak
   */
  static async updateStreak(userId: string): Promise<Profile> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile for streak:', error);
        throw error;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check if user already completed daily activity today
      // This would require a separate table to track daily activities
      // For now, let's assume we're updating streak
      
      const currentStreak = profile.current_streak || 0;
      const longestStreak = profile.longest_streak || 0;
      const newStreak = currentStreak + 1;
      const newLongestStreak = Math.max(newStreak, longestStreak);

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating streak:', updateError);
        throw updateError;
      }

      return updatedProfile;
    } catch (error) {
      console.error('GamificationService.updateStreak error:', error);
      throw error;
    }
  }

  /**
   * Award points for quiz completion
   */
  static async awardQuizPoints(
    userId: string, 
    correctAnswers: number, 
    totalQuestions: number,
    difficulty: number
  ): Promise<Profile> {
    const basePoints = correctAnswers * 5; // 5 points per correct answer
    const difficultyMultiplier = difficulty; // 1x for easy, 2x for medium, 5x for hard
    const bonusPoints = correctAnswers === totalQuestions ? 25 : 0; // Perfect score bonus
    
    const totalPoints = (basePoints * difficultyMultiplier) + bonusPoints;

    return await this.awardPoints({
      userId,
      points: totalPoints,
      reason: `Quiz completed: ${correctAnswers}/${totalQuestions} correct (difficulty ${difficulty})`,
      activityType: 'quiz_completed'
    });
  }

  /**
   * Award points for word of the day
   */
  static async awardWordOfDayPoints(userId: string): Promise<Profile> {
    return await this.awardPoints({
      userId,
      points: 5,
      reason: 'Viewed word of the day',
      activityType: 'word_of_day'
    });
  }

  /**
   * Award points for word search/learning
   */
  static async awardSearchPoints(userId: string, wordId: string): Promise<Profile> {
    return await this.awardPoints({
      userId,
      points: 1,
      reason: `Searched word: ${wordId}`,
      activityType: 'word_searched'
    });
  }

  /**
   * Get user's current progress to next level
   */
  static getProgressToNextLevel(profile: Profile): {
    currentLevel: LevelInfo;
    nextLevel: LevelInfo | null;
    progress: number; // 0-100
    pointsToNext: number;
  } {
    const currentLevel = this.getLevelInfo(profile.level || 1);
    const nextLevel = profile.level && profile.level < 5 ? this.getLevelInfo(profile.level + 1) : null;
    
    const currentPoints = profile.total_points || 0;
    const pointsInLevel = currentPoints - currentLevel.minPoints;
    const pointsForLevel = currentLevel.maxPoints === Infinity 
      ? 1000 // Use 1000 for max level calculation
      : currentLevel.maxPoints - currentLevel.minPoints + 1;
    
    const progress = Math.min(100, (pointsInLevel / pointsForLevel) * 100);
    const pointsToNext = nextLevel ? nextLevel.minPoints - currentPoints : 0;

    return {
      currentLevel,
      nextLevel,
      progress,
      pointsToNext
    };
  }
}