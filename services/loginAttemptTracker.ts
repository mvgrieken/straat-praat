import { AuthAnalyticsService } from './authAnalyticsService';
import { supabase } from './supabase';
import { LoginAttempt, LoginAttemptConfig } from '@/types';

export interface LoginAttemptResult {
  success: boolean;
  locked: boolean;
  remainingAttempts: number;
  lockoutExpiry?: Date;
  message: string;
}

export class LoginAttemptTracker {
  private static readonly DEFAULT_CONFIG: LoginAttemptConfig = {
    maxAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    resetAfterSuccess: true,
    trackIPAddress: true
  };

  static async trackLoginAttempt(
    email: string, 
    success: boolean, 
    config: Partial<LoginAttemptConfig> = {}
  ): Promise<LoginAttemptResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      // Get user ID from email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === email);
      const userId = user?.id || null;

      // Get current security status
      const securityStatus = await this.getSecurityStatus(email, finalConfig);
      
      if (securityStatus.locked) {
        return {
          success: false,
          locked: true,
          remainingAttempts: 0,
          lockoutExpiry: securityStatus.lockoutExpiry,
          message: `Account is locked. Try again after ${securityStatus.lockoutExpiry?.toLocaleTimeString()}`
        };
      }

      // Update attempt count
      if (!success) {
        await this.incrementFailedAttempts(email, finalConfig);
      } else if (finalConfig.resetAfterSuccess) {
        await this.resetFailedAttempts(email);
      }

      // Log the attempt
      await AuthAnalyticsService.trackLoginAttempt(userId, {
        email,
        success,
        failureReason: success ? undefined : 'Invalid credentials'
      });

      // Check if account should be locked
      const updatedStatus = await this.getSecurityStatus(email, finalConfig);
      
      if (updatedStatus.locked) {
        await this.lockAccount(email, finalConfig.lockoutDuration);
        return {
          success: false,
          locked: true,
          remainingAttempts: 0,
          lockoutExpiry: updatedStatus.lockoutExpiry,
          message: `Too many failed attempts. Account locked for ${finalConfig.lockoutDuration} minutes.`
        };
      }

      return {
        success,
        locked: false,
        remainingAttempts: updatedStatus.remainingAttempts,
        message: success ? 'Login successful' : `Login failed. ${updatedStatus.remainingAttempts} attempts remaining.`
      };

    } catch (error) {
      console.error('Error tracking login attempt:', error);
      return {
        success: false,
        locked: false,
        remainingAttempts: 0,
        message: 'Error tracking login attempt'
      };
    }
  }

  private static async getSecurityStatus(
    email: string, 
    config: LoginAttemptConfig
  ): Promise<{ locked: boolean; remainingAttempts: number; lockoutExpiry?: Date }> {
    try {
      // Get user ID from email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === email);
      
      if (!user) {
        return { locked: false, remainingAttempts: config.maxAttempts };
      }

      // Get security record
      const { data: securityData, error } = await supabase
        .from('user_security')
        .select('failed_login_attempts, locked_until')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting security status:', error);
        return { locked: false, remainingAttempts: config.maxAttempts };
      }

      const failedAttempts = securityData?.failed_login_attempts || 0;
      const lockedUntil = securityData?.locked_until ? new Date(securityData.locked_until) : null;

      // Check if account is currently locked
      const isLocked = lockedUntil && lockedUntil > new Date();
      
      if (isLocked) {
        return {
          locked: true,
          remainingAttempts: 0,
          lockoutExpiry: lockedUntil
        };
      }

      // If lockout period has expired, reset attempts
      if (lockedUntil && lockedUntil <= new Date()) {
        await this.resetFailedAttempts(email);
        return {
          locked: false,
          remainingAttempts: config.maxAttempts
        };
      }

      return {
        locked: false,
        remainingAttempts: Math.max(0, config.maxAttempts - failedAttempts)
      };

    } catch (error) {
      console.error('Error getting security status:', error);
      return { locked: false, remainingAttempts: config.maxAttempts };
    }
  }

  private static async incrementFailedAttempts(email: string, config: LoginAttemptConfig): Promise<void> {
    try {
      // Get user ID from email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === email);
      
      if (!user) return;

      // Upsert security record
      const { error } = await supabase
        .from('user_security')
        .upsert({
          user_id: user.id,
          failed_login_attempts: 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error incrementing failed attempts:', error);
        return;
      }

      // Increment the count
      const { error: updateError } = await supabase
        .from('user_security')
        .update({
          failed_login_attempts: supabase.sql`failed_login_attempts + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating failed attempts:', updateError);
      }

    } catch (error) {
      console.error('Error incrementing failed attempts:', error);
    }
  }

  private static async resetFailedAttempts(email: string): Promise<void> {
    try {
      // Get user ID from email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === email);
      
      if (!user) return;

      // Reset security record
      const { error } = await supabase
        .from('user_security')
        .upsert({
          user_id: user.id,
          failed_login_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error resetting failed attempts:', error);
      }

    } catch (error) {
      console.error('Error resetting failed attempts:', error);
    }
  }

  private static async lockAccount(email: string, lockoutDuration: number): Promise<void> {
    try {
      // Get user ID from email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === email);
      
      if (!user) return;

      const lockoutExpiry = new Date(Date.now() + lockoutDuration * 60 * 1000);

      // Update security record
      const { error } = await supabase
        .from('user_security')
        .upsert({
          user_id: user.id,
          locked_until: lockoutExpiry.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error locking account:', error);
      }

      // Log security event
      await AuthAnalyticsService.trackSecurityEvent('account_locked', user.id, {
        email,
        lockoutDuration,
        lockoutExpiry: lockoutExpiry.toISOString(),
        reason: 'Too many failed login attempts'
      });

    } catch (error) {
      console.error('Error locking account:', error);
    }
  }

  static async unlockAccount(email: string): Promise<boolean> {
    try {
      // Get user ID from email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === email);
      
      if (!user) return false;

      // Reset security record
      const { error } = await supabase
        .from('user_security')
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error unlocking account:', error);
        return false;
      }

      // Log security event
      await AuthAnalyticsService.trackSecurityEvent('account_unlocked', user.id, {
        email,
        reason: 'Manual unlock'
      });

      return true;

    } catch (error) {
      console.error('Error unlocking account:', error);
      return false;
    }
  }

  static async getAccountStatus(email: string): Promise<{
    locked: boolean;
    failedAttempts: number;
    lockoutExpiry?: Date;
    lastLoginAt?: Date;
  }> {
    try {
      // Get user ID from email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === email);
      
      if (!user) {
        return { locked: false, failedAttempts: 0 };
      }

      // Get security record
      const { data: securityData, error } = await supabase
        .from('user_security')
        .select('failed_login_attempts, locked_until, last_login_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting account status:', error);
        return { locked: false, failedAttempts: 0 };
      }

      const failedAttempts = securityData?.failed_login_attempts || 0;
      const lockedUntil = securityData?.locked_until ? new Date(securityData.locked_until) : null;
      const lastLoginAt = securityData?.last_login_at ? new Date(securityData.last_login_at) : undefined;

      const isLocked = lockedUntil && lockedUntil > new Date();

      return {
        locked: isLocked,
        failedAttempts,
        lockoutExpiry: isLocked ? lockedUntil : undefined,
        lastLoginAt
      };

    } catch (error) {
      console.error('Error getting account status:', error);
      return { locked: false, failedAttempts: 0 };
    }
  }
}
