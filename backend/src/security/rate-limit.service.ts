import { Injectable, Logger } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after exceeding limit
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly limits = new Map<string, RateLimitEntry>();
  private readonly blockedKeys = new Map<string, number>(); // key -> unblock time

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
    blocked: boolean;
  }> {
    const now = Date.now();

    // Check if key is currently blocked
    const blockedUntil = this.blockedKeys.get(key);
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: blockedUntil,
        blocked: true,
      };
    } else if (blockedUntil && now >= blockedUntil) {
      // Unblock the key
      this.blockedKeys.delete(key);
    }

    let entry = this.limits.get(key);

    // Create new entry if it doesn't exist or window has expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      this.limits.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      // Block the key if blockDurationMs is specified
      if (config.blockDurationMs) {
        this.blockedKeys.set(key, now + config.blockDurationMs);
        this.logger.warn(`Rate limit exceeded for key: ${key}. Blocked for ${config.blockDurationMs}ms`);
      }

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
        blocked: Boolean(config.blockDurationMs),
      };
    }

    // Increment counter
    entry.count++;

    return {
      allowed: true,
      remainingRequests: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      blocked: false,
    };
  }

  async getRemainingRequests(key: string, maxRequests: number): Promise<number> {
    const entry = this.limits.get(key);
    if (!entry) {
      return maxRequests;
    }

    if (Date.now() >= entry.resetTime) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  async clearLimit(key: string): Promise<void> {
    this.limits.delete(key);
    this.blockedKeys.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    let cleanedLimits = 0;
    let cleanedBlocks = 0;

    // Clean expired rate limit entries
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
        cleanedLimits++;
      }
    }

    // Clean expired blocks
    for (const [key, unblockTime] of this.blockedKeys.entries()) {
      if (now >= unblockTime) {
        this.blockedKeys.delete(key);
        cleanedBlocks++;
      }
    }

    if (cleanedLimits > 0 || cleanedBlocks > 0) {
      this.logger.debug(`Cleaned ${cleanedLimits} expired rate limits and ${cleanedBlocks} expired blocks`);
    }
  }

  getStats(): {
    activeLimits: number;
    activeBlocks: number;
    totalMemoryUsage: string;
  } {
    const memoryUsage = process.memoryUsage();
    
    return {
      activeLimits: this.limits.size,
      activeBlocks: this.blockedKeys.size,
      totalMemoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    };
  }
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // API endpoints
  API_DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  
  API_STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
  },

  // File uploads
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },

  // Metadata API calls
  METADATA_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // Installation attempts
  INSTALLATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },

  // Login attempts
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
} as const;
