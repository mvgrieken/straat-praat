export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
  score: number;
}

export type PasswordStrength = 'very_weak' | 'weak' | 'medium' | 'strong' | 'very_strong';

export class PasswordSecurityService {
  private static readonly MIN_LENGTH = 8;
  private static readonly REQUIRE_UPPERCASE = true;
  private static readonly REQUIRE_LOWERCASE = true;
  private static readonly REQUIRE_NUMBERS = true;
  private static readonly REQUIRE_SPECIAL_CHARS = true;

  static validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }
    
    if (this.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (this.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (this.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (this.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    const score = this.calculateStrength(password);
    const strength = this.scoreToStrength(score);
    
    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score
    };
  }

  private static calculateStrength(password: string): number {
    let score = 0;
    
    // Length contribution (0-25 points)
    score += Math.min(password.length * 4, 25);
    
    // Character variety contribution (0-45 points)
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    
    // Deduct for patterns and common weaknesses
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe|password|123456/i.test(password)) score -= 20; // Common patterns
    if (password.length < 8) score -= 15; // Too short
    
    // Bonus for length
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 15;
    
    // Bonus for mixed case
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 5;
    
    // Bonus for numbers and special chars
    if (/\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private static scoreToStrength(score: number): PasswordStrength {
    if (score >= 90) return 'very_strong';
    if (score >= 80) return 'strong';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'weak';
    return 'very_weak';
  }

  static getStrengthColor(strength: PasswordStrength): string {
    switch (strength) {
      case 'very_strong': return '#10B981'; // Green
      case 'strong': return '#059669'; // Green
      case 'medium': return '#F59E0B'; // Yellow
      case 'weak': return '#DC2626'; // Red
      case 'very_weak': return '#991B1B'; // Dark Red
      default: return '#6B7280'; // Gray
    }
  }

  static getStrengthLabel(strength: PasswordStrength): string {
    switch (strength) {
      case 'very_strong': return 'Very Strong';
      case 'strong': return 'Strong';
      case 'medium': return 'Medium';
      case 'weak': return 'Weak';
      case 'very_weak': return 'Very Weak';
      default: return 'Unknown';
    }
  }

  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'master', 'hello', 'freedom', 'whatever',
      'qwerty123', 'trustno1', 'jordan', 'harley', 'ranger',
      'iwantu', 'jennifer', 'hunter', 'buster', 'soccer',
      'baseball', 'tiger', 'charlie', 'andrew', 'michelle',
      'love', 'jessica', 'asshole', '2000', 'chelsea',
      'black', 'diamond', 'nascar', 'jackson', 'cameron',
      '654321', 'computer', 'amanda', 'wizard', 'xxxxxxxx',
      'money', 'phoenix', 'mickey', 'bailey', 'knight',
      'iceman', 'tigers', 'purple', 'andrea', 'horny',
      'dakota', 'aaaaaa', 'player', 'sunshine', 'morgan',
      'starwars', 'boomer', 'cowboys', 'edward', 'charles',
      'girls', 'coffee', 'bulldog', 'ncc1701', 'rabbit',
      'peanut', 'johnson', 'chester', 'london', 'midnight',
      'blue', 'fishing', '000000', 'hacker', 'slayer',
      'matt', 'qweasd', 'ranger', 'shadow', 'baseball',
      'buster', 'dragon', 'jordan', 'mickey', 'andrea'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }
}
