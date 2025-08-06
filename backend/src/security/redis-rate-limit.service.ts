import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after exceeding limit
  algorithm?: 'fixed' | 'sliding'; // Rate limiting algorithm
}

interface RateLimitResponse {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  blocked: boolean;
}

@Injectable()
export class RedisRateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisRateLimitService.name);
  private cleanupInterval: NodeJS.Timeout;
  private fallbackLimits = new Map<string, any>(); // Fallback for Redis failures

  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {
    // Auto-cleanup every 5 minutes for fallback storage
    this.cleanupInterval = setInterval(() => {
      this.cleanupFallback();
    }, 5 * 60 * 1000);
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    // Input validation
    if (!key || typeof key !== 'string') {
      throw new Error('Rate limit key must be a non-empty string');
    }
    
    if (!config || config.windowMs <= 0 || config.maxRequests <= 0) {
      throw new Error('Invalid rate limit configuration');
    }

    try {
      if (config.algorithm === 'sliding') {
        return await this.checkSlidingWindowLimit(key, config);
      } else {
        return await this.checkFixedWindowLimit(key, config);
      }
    } catch (error) {
      this.logger.error(`Redis rate limit check failed for key ${key}:`, error);
      // Fallback to in-memory rate limiting
      return this.checkFallbackLimit(key, config);
    }
  }

  private async checkFixedWindowLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    const now = Date.now();
    const windowKey = `rate_limit:${key}`;
    const blockKey = `rate_limit_block:${key}`;

    // Check if blocked
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      const ttl = await this.redis.ttl(blockKey);
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: now + (ttl * 1000),
        blocked: true,
      };
    }

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results || results.some(([err]) => err)) {
      throw new Error('Redis pipeline execution failed');
    }

    const count = results[0][1] as number;

    if (count > config.maxRequests) {
      // Set block if configured
      if (config.blockDurationMs) {
        await this.redis.setex(
          blockKey,
          Math.ceil(config.blockDurationMs / 1000),
          '1'
        );
        
        this.logger.warn(
          `Rate limit exceeded for key: ${key}. Blocked for ${config.blockDurationMs}ms`
        );
      }

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: now + config.windowMs,
        blocked: Boolean(config.blockDurationMs),
      };
    }

    return {
      allowed: true,
      remainingRequests: config.maxRequests - count,
      resetTime: now + config.windowMs,
      blocked: false,
    };
  }

  private async checkSlidingWindowLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResponse> {
    const now = Date.now();
    const windowKey = `sliding_rate_limit:${key}`;
    const blockKey = `rate_limit_block:${key}`;
    const windowStart = now - config.windowMs;

    // Check if blocked
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      const ttl = await this.redis.ttl(blockKey);
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: now + (ttl * 1000),
        blocked: true,
      };
    }

    // Use sorted set for sliding window
    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(windowKey, 0, windowStart);
    
    // Count current requests in window
    pipeline.zcard(windowKey);
    
    // Add current request
    pipeline.zadd(windowKey, now, `${now}-${Math.random()}`);
    
    // Set expiration
    pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results || results.some(([err]) => err)) {
      throw new Error('Redis sliding window pipeline execution failed');
    }

    const count = results[1][1] as number;

    if (count >= config.maxRequests) {
      // Remove the request we just added since it's not allowed
      await this.redis.zrem(windowKey, `${now}-${Math.random()}`);
      
      if (config.blockDurationMs) {
        await this.redis.setex(
          blockKey,
          Math.ceil(config.blockDurationMs / 1000),
          '1'
        );
      }

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: now + config.windowMs,
        blocked: Boolean(config.blockDurationMs),
      };
    }

    return {
      allowed: true,
      remainingRequests: config.maxRequests - count - 1, // -1 for current request
      resetTime: now + config.windowMs,
      blocked: false,
    };
  }

  private checkFallbackLimit(
    key: string,
    config: RateLimitConfig
  ): RateLimitResponse {
    const now = Date.now();
    
    // Use the same logic as the original in-memory implementation
    let entry = this.fallbackLimits.get(key);

    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        requests: [],
      };
      this.fallbackLimits.set(key, entry);
    }

    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
        blocked: false, // No blocking in fallback mode
      };
    }

    entry.count++;

    return {
      allowed: true,
      remainingRequests: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      blocked: false,
    };
  }

  async getRemainingRequests(key: string, maxRequests: number): Promise<number> {
    try {
      const windowKey = `rate_limit:${key}`;
      const count = await this.redis.get(windowKey);
      
      if (!count) {
        return maxRequests;
      }

      const currentCount = parseInt(count, 10);
      return Math.max(0, maxRequests - currentCount);
    } catch (error) {
      this.logger.error(`Failed to get remaining requests for ${key}:`, error);
      // Fallback
      const entry = this.fallbackLimits.get(key);
      if (!entry || Date.now() >= entry.resetTime) {
        return maxRequests;
      }
      return Math.max(0, maxRequests - entry.count);
    }
  }

  async clearLimit(key: string): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.del(`rate_limit:${key}`);
      pipeline.del(`sliding_rate_limit:${key}`);
      pipeline.del(`rate_limit_block:${key}`);
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to clear limit for ${key}:`, error);
    }
    
    // Also clear fallback
    this.fallbackLimits.delete(key);
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically, but we can clean up fallback storage
    this.cleanupFallback();
  }

  private cleanupFallback(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.fallbackLimits.entries()) {
      if (now >= entry.resetTime) {
        this.fallbackLimits.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired fallback rate limits`);
    }
  }

  async getStats(): Promise<{
    activeLimits: number;
    activeBlocks: number;
    totalMemoryUsage: string;
    redisConnected: boolean;
    fallbackEntries: number;
    topLimitedKeys?: Array<{ key: string; count: number }>;
  }> {
    const memoryUsage = process.memoryUsage();
    
    try {
      // Get Redis stats
      const info = await this.redis.info('memory');
      const redisMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim() || 'unknown';
      
      // Count Redis keys (this might be expensive in production)
      const rateLimitKeys = await this.redis.keys('rate_limit:*');
      const blockKeys = await this.redis.keys('rate_limit_block:*');
      
      return {
        activeLimits: rateLimitKeys.length,
        activeBlocks: blockKeys.length,
        totalMemoryUsage: `Node: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB, Redis: ${redisMemory}`,
        redisConnected: true,
        fallbackEntries: this.fallbackLimits.size,
      };
    } catch (error) {
      this.logger.error('Failed to get Redis stats:', error);
      return {
        activeLimits: 0,
        activeBlocks: 0,
        totalMemoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB (Redis unavailable)`,
        redisConnected: false,
        fallbackEntries: this.fallbackLimits.size,
      };
    }
  }

  async healthCheck(): Promise<{ redis: boolean; fallback: boolean }> {
    try {
      await this.redis.ping();
      return { redis: true, fallback: true };
    } catch (error) {
      this.logger.warn('Redis health check failed:', error);
      return { redis: false, fallback: true };
    }
  }
}

// Enhanced rate limit configurations with Redis support
export const REDIS_RATE_LIMIT_CONFIGS = {
  // API endpoints
  API_DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    algorithm: 'fixed' as const,
  },
  
  API_STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
    algorithm: 'sliding' as const,
  },

  // File uploads
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    algorithm: 'sliding' as const,
  },

  // Metadata API calls
  METADATA_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    algorithm: 'sliding' as const,
  },

  // Installation attempts
  INSTALLATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hour
    algorithm: 'fixed' as const,
  },

  // Login attempts
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    algorithm: 'sliding' as const,
  },
} as const;
