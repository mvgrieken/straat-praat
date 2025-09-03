/**
 * Rate limiter utility for API calls
 */
interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
  key?: string;
}

interface RateLimitState {
  requests: number[];
  blocked: boolean;
  blockedUntil?: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitState>();

  /**
   * Check if request is allowed
   */
  isAllowed(config: RateLimitConfig): boolean {
    const key = config.key || 'default';
    const now = Date.now();
    const state = this.limits.get(key) || { requests: [], blocked: false };

    // Check if currently blocked
    if (state.blocked && state.blockedUntil && now < state.blockedUntil) {
      return false;
    }

    // Clear expired requests
    const validRequests = state.requests.filter(
      timestamp => now - timestamp < config.timeWindow
    );

    // Check if limit exceeded
    if (validRequests.length >= config.maxRequests) {
      // Block until time window expires
      const oldestRequest = Math.min(...validRequests);
      const blockUntil = oldestRequest + config.timeWindow;
      
      this.limits.set(key, {
        requests: validRequests,
        blocked: true,
        blockedUntil: blockUntil
      });
      
      return false;
    }

    // Add current request
    validRequests.push(now);
    
    this.limits.set(key, {
      requests: validRequests,
      blocked: false
    });

    return true;
  }

  /**
   * Wait for rate limit to reset
   */
  async waitForReset(config: RateLimitConfig): Promise<void> {
    const key = config.key || 'default';
    const state = this.limits.get(key);
    
    if (state?.blocked && state.blockedUntil) {
      const waitTime = state.blockedUntil - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetTime?: number;
    blocked: boolean;
  } {
    const key = config.key || 'default';
    const now = Date.now();
    const state = this.limits.get(key) || { requests: [], blocked: false };
    
    const validRequests = state.requests.filter(
      timestamp => now - timestamp < config.timeWindow
    );
    
    const remaining = Math.max(0, config.maxRequests - validRequests.length);
    const oldestRequest = validRequests.length > 0 ? Math.min(...validRequests) : 0;
    const resetTime = oldestRequest + config.timeWindow;
    
    return {
      allowed: !state.blocked && remaining > 0,
      remaining,
      resetTime: validRequests.length > 0 ? resetTime : undefined,
      blocked: state.blocked || false
    };
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string = 'default'): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit decorator for functions
 */
export function withRateLimit<T extends any[], R>(
  config: RateLimitConfig,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    if (!rateLimiter.isAllowed(config)) {
      await rateLimiter.waitForReset(config);
    }
    
    return fn(...args);
  };
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  AUTH: {
    maxRequests: 5,
    timeWindow: 5 * 60 * 1000, // 5 minutes
    key: 'auth'
  },
  API: {
    maxRequests: 100,
    timeWindow: 60 * 1000, // 1 minute
    key: 'api'
  },
  SEARCH: {
    maxRequests: 20,
    timeWindow: 60 * 1000, // 1 minute
    key: 'search'
  }
} as const;
