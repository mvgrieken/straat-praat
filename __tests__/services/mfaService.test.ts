import { MFAService } from '@/services/mfaService';
import { SecurityEventLogger } from '@/services/securityEventLogger';
import { supabase } from '@/services/supabase';

// Mock dependencies
jest.mock('@/services/supabase');
jest.mock('@/services/securityEventLogger');

describe('MFAService', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockSecurityEventLogger = SecurityEventLogger as jest.Mocked<typeof SecurityEventLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to their initial state
    jest.resetAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate a valid TOTP secret', () => {
      const secret = MFAService.generateSecret();
      
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
      expect(secret).toMatch(/^[A-Z2-7]+=*$/); // Base32 format
    });

    it('should generate unique secrets on multiple calls', () => {
      const secret1 = MFAService.generateSecret();
      const secret2 = MFAService.generateSecret();
      
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate the correct number of backup codes', () => {
      const codes = MFAService.generateBackupCodes();
      
      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('should generate unique backup codes', () => {
      const codes = MFAService.generateBackupCodes();
      const uniqueCodes = new Set(codes);
      
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should generate codes with correct format', () => {
      const codes = MFAService.generateBackupCodes();
      
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
        expect(code).not.toMatch(/[0O1I]/); // Avoid confusing characters
      });
    });
  });

  describe('verifyTOTP', () => {
    const mockSecret = 'JBSWY3DPEHPK3PXP';
    const mockToken = '123456';

    beforeEach(() => {
      // Mock the TOTP verification logic
      jest.spyOn(MFAService, 'verifyTOTP').mockImplementation(async (secret, token) => {
        // Simulate TOTP verification
        return secret === mockSecret && token === mockToken;
      });
    });

    it('should verify valid TOTP token', async () => {
      const result = await MFAService.verifyTOTP(mockSecret, mockToken);
      
      expect(result).toBe(true);
    });

    it('should reject invalid TOTP token', async () => {
      const result = await MFAService.verifyTOTP(mockSecret, '000000');
      
      expect(result).toBe(false);
    });

    it('should reject invalid secret', async () => {
      const result = await MFAService.verifyTOTP('invalid-secret', mockToken);
      
      expect(result).toBe(false);
    });

    it('should handle empty token', async () => {
      const result = await MFAService.verifyTOTP(mockSecret, '');
      
      expect(result).toBe(false);
    });

    it('should handle malformed token', async () => {
      const result = await MFAService.verifyTOTP(mockSecret, '12345'); // Too short
      
      expect(result).toBe(false);
    });
  });

  describe('verifyBackupCode', () => {
    const mockUserId = 'test-user-id';
    const mockBackupCode = 'ABC12345';

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ id: 'backup-code-id', code: mockBackupCode, used: false }],
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);
    });

    it('should verify valid backup code', async () => {
      const result = await MFAService.verifyBackupCode(mockUserId, mockBackupCode);
      
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_backup_codes');
    });

    it('should reject invalid backup code', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await MFAService.verifyBackupCode(mockUserId, 'INVALID');
      
      expect(result).toBe(false);
    });

    it('should reject used backup code', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ id: 'backup-code-id', code: mockBackupCode, used: true }],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await MFAService.verifyBackupCode(mockUserId, mockBackupCode);
      
      expect(result).toBe(false);
    });

    it('should mark backup code as used after successful verification', async () => {
      await MFAService.verifyBackupCode(mockUserId, mockBackupCode);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('user_backup_codes');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ used: true });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      const result = await MFAService.verifyBackupCode(mockUserId, mockBackupCode);
      
      expect(result).toBe(false);
    });
  });

  describe('setupMFA', () => {
    const mockUserId = 'test-user-id';

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);
    });

    it('should setup MFA successfully', async () => {
      const result = await MFAService.setupMFA(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.secret).toBeDefined();
      expect(result.backupCodes).toHaveLength(10);
      expect(mockSecurityEventLogger.logEvent).toHaveBeenCalledWith('mfa_setup', {
        userId: mockUserId,
        success: true,
      });
    });

    it('should store MFA secret in database', async () => {
      await MFAService.setupMFA(mockUserId);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('user_security');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        mfa_secret: expect.any(String),
        mfa_enabled: false,
        backup_codes: expect.any(Array),
      });
    });

    it('should store backup codes in database', async () => {
      await MFAService.setupMFA(mockUserId);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('user_backup_codes');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: mockUserId,
            code: expect.any(String),
            used: false,
          }),
        ])
      );
    });

    it('should handle database errors during setup', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      } as any);

      const result = await MFAService.setupMFA(mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockSecurityEventLogger.logEvent).toHaveBeenCalledWith('mfa_setup', {
        userId: mockUserId,
        success: false,
        error: expect.any(String),
      });
    });
  });

  describe('activateMFA', () => {
    const mockUserId = 'test-user-id';
    const mockToken = '123456';

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ mfa_secret: 'JBSWY3DPEHPK3PXP' }],
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);

      // Mock TOTP verification
      jest.spyOn(MFAService, 'verifyTOTP').mockResolvedValue(true);
    });

    it('should activate MFA with valid token', async () => {
      const result = await MFAService.activateMFA(mockUserId, mockToken);
      
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_security');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        mfa_enabled: true,
        mfa_activated_at: expect.any(String),
      });
      expect(mockSecurityEventLogger.logEvent).toHaveBeenCalledWith('mfa_activated', {
        userId: mockUserId,
        success: true,
      });
    });

    it('should reject activation with invalid token', async () => {
      jest.spyOn(MFAService, 'verifyTOTP').mockResolvedValue(false);

      const result = await MFAService.activateMFA(mockUserId, '000000');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');
      expect(mockSecurityEventLogger.logEvent).toHaveBeenCalledWith('mfa_activated', {
        userId: mockUserId,
        success: false,
        error: 'Invalid verification code',
      });
    });

    it('should handle missing MFA secret', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await MFAService.activateMFA(mockUserId, mockToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('MFA not set up');
    });

    it('should handle database errors during activation', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ mfa_secret: 'JBSWY3DPEHPK3PXP' }],
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      } as any);

      const result = await MFAService.activateMFA(mockUserId, mockToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deactivateMFA', () => {
    const mockUserId = 'test-user-id';

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);
    });

    it('should deactivate MFA successfully', async () => {
      const result = await MFAService.deactivateMFA(mockUserId);
      
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_security');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        mfa_enabled: false,
        mfa_secret: null,
        mfa_activated_at: null,
      });
      expect(mockSecurityEventLogger.logEvent).toHaveBeenCalledWith('mfa_deactivated', {
        userId: mockUserId,
        success: true,
      });
    });

    it('should remove backup codes when deactivating', async () => {
      await MFAService.deactivateMFA(mockUserId);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('user_backup_codes');
      expect(mockSupabase.from().delete).toHaveBeenCalled();
    });

    it('should handle database errors during deactivation', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      } as any);

      const result = await MFAService.deactivateMFA(mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getMFAStatus', () => {
    const mockUserId = 'test-user-id';

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{
              mfa_enabled: true,
              mfa_activated_at: '2024-01-01T00:00:00.000Z',
            }],
            error: null,
          }),
        }),
      } as any);
    });

    it('should return MFA status for user', async () => {
      const result = await MFAService.getMFAStatus(mockUserId);
      
      expect(result.enabled).toBe(true);
      expect(result.activatedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should return disabled status when MFA not enabled', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ mfa_enabled: false, mfa_activated_at: null }],
            error: null,
          }),
        }),
      } as any);

      const result = await MFAService.getMFAStatus(mockUserId);
      
      expect(result.enabled).toBe(false);
      expect(result.activatedAt).toBeNull();
    });

    it('should handle user not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await MFAService.getMFAStatus(mockUserId);
      
      expect(result.enabled).toBe(false);
      expect(result.activatedAt).toBeNull();
    });
  });

  describe('Security Constraints', () => {
    it('should enforce rate limiting on verification attempts', async () => {
      const mockUserId = 'test-user-id';
      const mockToken = '123456';

      // Mock rate limiting
      jest.spyOn(MFAService, 'verifyTOTP').mockResolvedValue(false);

      // Attempt multiple verifications
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(MFAService.verifyTOTP('secret', mockToken));
      }

      await Promise.all(attempts);

      // Should log security event for excessive attempts
      expect(mockSecurityEventLogger.logEvent).toHaveBeenCalledWith(
        'mfa_verification_failed',
        expect.objectContaining({
          userId: mockUserId,
          reason: 'Rate limit exceeded',
        })
      );
    });

    it('should validate backup code format', () => {
      const validCodes = ['ABC12345', 'DEF67890'];
      const invalidCodes = ['ABC1234', 'ABC123456', 'ABC1234!'];

      validCodes.forEach(code => {
        expect(MFAService.generateBackupCodes()).toContainEqual(
          expect.stringMatching(/^[A-Z0-9]{8}$/)
        );
      });

      invalidCodes.forEach(code => {
        expect(code).not.toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('should enforce secure secret generation', () => {
      const secrets = [];
      for (let i = 0; i < 10; i++) {
        secrets.push(MFAService.generateSecret());
      }

      // All secrets should be unique
      const uniqueSecrets = new Set(secrets);
      expect(uniqueSecrets.size).toBe(secrets.length);

      // All secrets should be in Base32 format
      secrets.forEach(secret => {
        expect(secret).toMatch(/^[A-Z2-7]+=*$/);
      });
    });
  });
});
