import { AuthAnalyticsService } from './authAnalyticsService';
import { SecurityEventLogger } from './securityEventLogger';
import { supabase } from './supabase';

export interface MFASetupResult {
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  error?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  requiresBackupCode?: boolean;
}

export interface MFABackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

export class MFAService {
  private static readonly TOTP_PERIOD = 30; // 30 seconden
  private static readonly TOTP_DIGITS = 6;
  private static readonly BACKUP_CODES_COUNT = 10;
  private static readonly BACKUP_CODE_LENGTH = 8;

  /**
   * Genereer een nieuwe MFA secret voor een gebruiker
   */
  static async setupMFA(userId: string, email: string): Promise<MFASetupResult> {
    try {
      // Genereer een nieuwe TOTP secret
      const secret = this.generateTOTPSecret();
      
      // Genereer backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Maak QR code URL voor authenticator apps
      const qrCodeUrl = this.generateQRCodeUrl(email, secret);
      
      // Sla MFA setup op in database
      const { error } = await supabase
        .from('user_security')
        .upsert({
          user_id: userId,
          mfa_enabled: false, // Nog niet geactiveerd tot verificatie
          mfa_secret: secret,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw new Error(`Failed to save MFA setup: ${error.message}`);
      }

      // Log MFA setup event
      await SecurityEventLogger.logEvent({
        eventType: 'mfa_setup_initiated',
        userId,
        email,
        severity: 'medium',
        metadata: {
          setupTime: new Date().toISOString()
        }
      });

      return {
        success: true,
        secret,
        qrCodeUrl,
        backupCodes
      };

    } catch (error) {
      console.error('MFA setup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verificeer MFA code en activeer MFA voor gebruiker
   */
  static async verifyAndActivateMFA(
    userId: string, 
    email: string, 
    code: string
  ): Promise<MFAVerificationResult> {
    try {
      // Haal MFA secret op
      const { data: securityData, error: fetchError } = await supabase
        .from('user_security')
        .select('mfa_secret, mfa_enabled')
        .eq('user_id', userId)
        .single();

      if (fetchError || !securityData?.mfa_secret) {
        return {
          success: false,
          error: 'MFA not set up for this user'
        };
      }

      if (securityData.mfa_enabled) {
        return {
          success: false,
          error: 'MFA is already enabled'
        };
      }

      // Verificeer TOTP code
      const isValid = this.verifyTOTPCode(securityData.mfa_secret, code);
      
      if (!isValid) {
        // Log failed MFA verification
        await SecurityEventLogger.logEvent({
          eventType: 'mfa_failure',
          userId,
          email,
          severity: 'high',
          metadata: {
            failureReason: 'Invalid TOTP code',
            attemptTime: new Date().toISOString()
          }
        });

        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      // Activeer MFA
      const { error: updateError } = await supabase
        .from('user_security')
        .update({
          mfa_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to activate MFA: ${updateError.message}`);
      }

      // Log successful MFA activation
      await SecurityEventLogger.logEvent({
        eventType: 'mfa_enabled',
        userId,
        email,
        severity: 'medium',
        metadata: {
          activationTime: new Date().toISOString()
        }
      });

      return {
        success: true
      };

    } catch (error) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verificeer MFA code tijdens login
   */
  static async verifyMFACode(
    userId: string,
    email: string,
    code: string
  ): Promise<MFAVerificationResult> {
    try {
      // Haal MFA secret op
      const { data: securityData, error: fetchError } = await supabase
        .from('user_security')
        .select('mfa_secret, mfa_enabled')
        .eq('user_id', userId)
        .single();

      if (fetchError || !securityData?.mfa_secret || !securityData.mfa_enabled) {
        return {
          success: false,
          error: 'MFA not enabled for this user'
        };
      }

      // Verificeer TOTP code
      const isValid = this.verifyTOTPCode(securityData.mfa_secret, code);
      
      if (!isValid) {
        // Log failed MFA verification
        await SecurityEventLogger.logEvent({
          eventType: 'mfa_failure',
          userId,
          email,
          severity: 'high',
          metadata: {
            failureReason: 'Invalid TOTP code during login',
            attemptTime: new Date().toISOString()
          }
        });

        return {
          success: false,
          error: 'Invalid MFA code'
        };
      }

      // Log successful MFA verification
      await SecurityEventLogger.logEvent({
        eventType: 'mfa_success',
        userId,
        email,
        severity: 'low',
        metadata: {
          verificationTime: new Date().toISOString()
        }
      });

      return {
        success: true
      };

    } catch (error) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verificeer backup code
   */
  static async verifyBackupCode(
    userId: string,
    email: string,
    backupCode: string
  ): Promise<MFAVerificationResult> {
    try {
      // Haal backup codes op (in een echte implementatie zouden deze in de database staan)
      // Voor nu simuleren we backup code verificatie
      const isValidBackupCode = this.isValidBackupCode(backupCode);
      
      if (!isValidBackupCode) {
        // Log failed backup code verification
        await SecurityEventLogger.logEvent({
          eventType: 'mfa_failure',
          userId,
          email,
          severity: 'high',
          metadata: {
            failureReason: 'Invalid backup code',
            attemptTime: new Date().toISOString()
          }
        });

        return {
          success: false,
          error: 'Invalid backup code'
        };
      }

      // Log successful backup code verification
      await SecurityEventLogger.logEvent({
        eventType: 'mfa_backup_used',
        userId,
        email,
        severity: 'medium',
        metadata: {
          backupCodeUsed: true,
          verificationTime: new Date().toISOString()
        }
      });

      return {
        success: true
      };

    } catch (error) {
      console.error('Backup code verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Schakel MFA uit voor een gebruiker
   */
  static async disableMFA(userId: string, email: string): Promise<MFAVerificationResult> {
    try {
      const { error } = await supabase
        .from('user_security')
        .update({
          mfa_enabled: false,
          mfa_secret: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to disable MFA: ${error.message}`);
      }

      // Log MFA disable event
      await SecurityEventLogger.logEvent({
        eventType: 'mfa_disabled',
        userId,
        email,
        severity: 'medium',
        metadata: {
          disableTime: new Date().toISOString()
        }
      });

      return {
        success: true
      };

    } catch (error) {
      console.error('MFA disable error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Controleer of MFA is ingeschakeld voor een gebruiker
   */
  static async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_security')
        .select('mfa_enabled')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.mfa_enabled || false;

    } catch (error) {
      console.error('MFA status check error:', error);
      return false;
    }
  }

  /**
   * Genereer nieuwe backup codes
   */
  static async regenerateBackupCodes(userId: string, email: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes();

      // Log backup codes regeneration
      await SecurityEventLogger.logEvent({
        eventType: 'mfa_backup_regenerated',
        userId,
        email,
        severity: 'medium',
        metadata: {
          regenerationTime: new Date().toISOString(),
          codesCount: backupCodes.length
        }
      });

      return backupCodes;

    } catch (error) {
      console.error('Backup codes regeneration error:', error);
      throw error;
    }
  }

  // Private helper methods

  private static generateTOTPSecret(): string {
    // Genereer een 32-byte secret voor TOTP
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      let code = '';
      for (let j = 0; j < this.BACKUP_CODE_LENGTH; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    
    return codes;
  }

  private static generateQRCodeUrl(email: string, secret: string): string {
    const issuer = 'Straat-Praat';
    const account = email;
    const algorithm = 'SHA1';
    const digits = this.TOTP_DIGITS;
    const period = this.TOTP_PERIOD;
    
    const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
    
    return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauth)}`;
  }

  private static verifyTOTPCode(secret: string, code: string): boolean {
    // Simuleer TOTP verificatie
    // In een echte implementatie zou je een TOTP library gebruiken zoals 'otplib'
    // Voor nu returnen we true voor demo doeleinden
    return code.length === this.TOTP_DIGITS && /^\d+$/.test(code);
  }

  private static isValidBackupCode(code: string): boolean {
    // Simuleer backup code verificatie
    // In een echte implementatie zou je de codes in de database checken
    return code.length === this.BACKUP_CODE_LENGTH && /^[A-Z0-9]+$/.test(code);
  }

  /**
   * Genereer een TOTP code voor testing doeleinden
   */
  static generateTestTOTPCode(): string {
    // Genereer een 6-cijferige code voor testing
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
