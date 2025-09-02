import { supabase } from './supabase';
import { CommunityContribution, ModerationResult, ModerationStats } from '@/types';

export interface ModerationAction {
  contributionId: string;
  moderatorId: string;
  action: 'approve' | 'reject';
  notes?: string;
  suggestedChanges?: {
    word?: string;
    meaning?: string;
    context?: string;
  };
}

interface UpdateContributionData {
  status: 'approved' | 'rejected';
  moderator_id: string;
  moderator_notes: string;
  updated_at: string;
}

interface SuggestedChanges {
  word?: string;
  meaning?: string;
  context?: string;
}

interface ModeratorPerformanceStats {
  moderatorId: string;
  moderatorName: string;
  contributionsProcessed: number;
  averageProcessingTime: number;
}

export class CommunityModerationService {
  /**
   * Submit a new community contribution
   */
  static async submitContribution(contribution: Omit<CommunityContribution, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      // Check if word already exists
      const existingWord = await this.checkWordExists(contribution.word);
      if (existingWord) {
        throw new Error('Dit woord bestaat al in de woordenlijst');
      }

      // Check if similar contribution is already pending
      const similarContribution = await this.checkSimilarContribution(contribution.word);
      if (similarContribution) {
        throw new Error('Een vergelijkbare bijdrage is al in behandeling');
      }

      const { error } = await supabase
        .from('community_contributions')
        .insert({
          user_id: contribution.user_id,
          word: contribution.word,
          meaning: contribution.meaning,
          context: contribution.context,
          status: 'pending',
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to submit contribution:', error);
      throw error;
    }
  }

  /**
   * Get pending contributions for moderation
   */
  static async getPendingContributions(limit: number = 50, offset: number = 0): Promise<CommunityContribution[]> {
    try {
      const { data, error } = await supabase
        .from('community_contributions')
        .select(`
          *,
          profiles:user_id(full_name, display_name),
          moderator:moderator_id(full_name, display_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get pending contributions:', error);
      throw error;
    }
  }

  /**
   * Process moderation for a contribution
   */
  static async processModeration({
    contributionId,
    moderatorId,
    action,
    notes,
    suggestedChanges,
  }: ModerationAction): Promise<boolean> {
    try {
      // Get the contribution
      const { data: contribution, error: fetchError } = await supabase
        .from('community_contributions')
        .select('*')
        .eq('id', contributionId)
        .single();

      if (fetchError || !contribution) {
        throw new Error('Bijdrage niet gevonden');
      }

      // Update contribution status
      const updateData: UpdateContributionData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        moderator_id: moderatorId,
        moderator_notes: notes || '',
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('community_contributions')
        .update(updateData)
        .eq('id', contributionId);

      if (updateError) {
        throw updateError;
      }

      // If approved, add to main words table
      if (action === 'approve') {
        await this.addToWordsTable(contribution, suggestedChanges);
      }

      // Send notification to user if they have an account
      if (contribution.user_id) {
        await this.sendModerationNotification(contribution.user_id, action, contribution.word);
      }

      return true;
    } catch (error) {
      console.error('Failed to process moderation:', error);
      throw error;
    }
  }

  /**
   * Add approved contribution to main words table
   */
  private static async addToWordsTable(contribution: CommunityContribution, suggestedChanges?: SuggestedChanges): Promise<void> {
    try {
      const wordData = {
        word: suggestedChanges?.word || contribution.word,
        meaning: suggestedChanges?.meaning || contribution.meaning,
        example: suggestedChanges?.context || contribution.context,
        difficulty: 'medium',
        category: 'community',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('slang_words')
        .insert(wordData);

      if (error) {
        console.error('Failed to add word to main table:', error);
        // Don't throw here, as the moderation was successful
      }
    } catch (error) {
      console.error('Failed to add word to main table:', error);
    }
  }

  /**
   * Send moderation notification to user
   */
  private static async sendModerationNotification(userId: string, action: string, word: string): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, we'll just log it
      console.log(`Notification sent to user ${userId}: Word "${word}" was ${action === 'approve' ? 'approved' : 'rejected'}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Get moderation statistics
   */
  static async getModerationStats(): Promise<ModerationStats> {
    try {
      // Get basic counts
      const { data: counts, error: countsError } = await supabase
        .from('community_contributions')
        .select('status, created_at, updated_at, moderator_id');

      if (countsError) {
        throw countsError;
      }

      const totalPending = counts?.filter(c => c.status === 'pending').length || 0;
      const totalApproved = counts?.filter(c => c.status === 'approved').length || 0;
      const totalRejected = counts?.filter(c => c.status === 'rejected').length || 0;

      // Calculate average processing time
      const processedContributions = counts?.filter(c => c.status !== 'pending' && c.updated_at) || [];
      let totalProcessingTime = 0;
      let validProcessingTimes = 0;

      processedContributions.forEach(contribution => {
        if (contribution.created_at && contribution.updated_at) {
          const created = new Date(contribution.created_at);
          const updated = new Date(contribution.updated_at);
          const processingTime = updated.getTime() - created.getTime();
          if (processingTime > 0) {
            totalProcessingTime += processingTime;
            validProcessingTimes++;
          }
        }
      });

      const averageProcessingTime = validProcessingTimes > 0 ? totalProcessingTime / validProcessingTimes : 0;

      // Get moderator performance
      const moderatorStats = await this.getModeratorPerformance();

      return {
        totalPending,
        totalApproved,
        totalRejected,
        averageProcessingTime,
        moderatorPerformance: moderatorStats,
      };
    } catch (error) {
      console.error('Failed to get moderation stats:', error);
      return {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        averageProcessingTime: 0,
        moderatorPerformance: [],
      };
    }
  }

  /**
   * Get moderator performance statistics
   */
  private static async getModeratorPerformance(): Promise<ModeratorPerformanceStats[]> {
    try {
      const { data, error } = await supabase
        .from('community_contributions')
        .select(`
          moderator_id,
          created_at,
          updated_at,
          profiles:moderator_id(full_name, display_name)
        `)
        .not('moderator_id', 'is', null);

      if (error || !data) {
        return [];
      }

      // Group by moderator and calculate stats
      const moderatorMap = new Map<string, {
        moderatorId: string;
        moderatorName: string;
        contributionsProcessed: number;
        totalProcessingTime: number;
        validProcessingTimes: number;
      }>();
      
      data.forEach(contribution => {
        if (contribution.moderator_id) {
          const moderatorId = contribution.moderator_id;
          if (!moderatorMap.has(moderatorId)) {
            moderatorMap.set(moderatorId, {
              moderatorId,
              moderatorName: contribution.profiles?.display_name || contribution.profiles?.full_name || 'Onbekend',
              contributionsProcessed: 0,
              totalProcessingTime: 0,
              validProcessingTimes: 0,
            });
          }

          const stats = moderatorMap.get(moderatorId)!;
          stats.contributionsProcessed++;

          if (contribution.created_at && contribution.updated_at) {
            const created = new Date(contribution.created_at);
            const updated = new Date(contribution.updated_at);
            const processingTime = updated.getTime() - created.getTime();
            if (processingTime > 0) {
              stats.totalProcessingTime += processingTime;
              stats.validProcessingTimes++;
            }
          }
        }
      });

      return Array.from(moderatorMap.values()).map(stats => ({
        moderatorId: stats.moderatorId,
        moderatorName: stats.moderatorName,
        contributionsProcessed: stats.contributionsProcessed,
        averageProcessingTime: stats.validProcessingTimes > 0 ? stats.totalProcessingTime / stats.validProcessingTimes : 0,
      }));
    } catch (error) {
      console.error('Failed to get moderator performance:', error);
      return [];
    }
  }

  /**
   * Check if word already exists in main table
   */
  private static async checkWordExists(word: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('id')
        .or(`word.ilike.%${word}%,meaning.ilike.%${word}%`)
        .limit(1);

      if (error) {
        throw error;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Failed to check word existence:', error);
      return false;
    }
  }

  /**
   * Check if similar contribution is already pending
   */
  private static async checkSimilarContribution(word: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('community_contributions')
        .select('id')
        .eq('status', 'pending')
        .or(`word.ilike.%${word}%,meaning.ilike.%${word}%`)
        .limit(1);

      if (error) {
        throw error;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Failed to check similar contribution:', error);
      return false;
    }
  }

  /**
   * Get user's contribution history
   */
  static async getUserContributions(userId: string): Promise<CommunityContribution[]> {
    try {
      const { data, error } = await supabase
        .from('community_contributions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        word: item.word,
        meaning: item.meaning,
        context: item.context,
        status: item.status,
        moderatorId: item.moderator_id,
        moderatorNotes: item.moderator_notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch (error) {
      console.error('Failed to get user contributions:', error);
      return [];
    }
  }

  /**
   * Bulk moderate multiple contributions
   */
  static async bulkModerate(actions: ModerationAction[]): Promise<boolean[]> {
    try {
      const results = await Promise.allSettled(
        actions.map(action => this.processModeration(action))
      );

      return results.map(result => 
        result.status === 'fulfilled' ? result.value : false
      );
    } catch (error) {
      console.error('Failed to bulk moderate:', error);
      return actions.map(() => false);
    }
  }
}
