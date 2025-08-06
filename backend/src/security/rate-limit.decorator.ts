import { applyDecorators, UseGuards } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

export const RATE_LIMIT_KEY = 'rate-limit';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
  algorithm?: 'fixed' | 'sliding';
  keyGenerator?: (req: any) => string;
  skipIf?: (req: any) => boolean;
  message?: string;
}

export const RateLimit = (options: RateLimitOptions) =>
  applyDecorators(
    SetMetadata(RATE_LIMIT_KEY, options),
    UseGuards(RateLimitGuard),
  );

// Predefined decorators for common use cases
export const StrictRateLimit = () =>
  RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
    algorithm: 'sliding',
  });

export const UploadRateLimit = () =>
  RateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    algorithm: 'sliding',
  });

export const LoginRateLimit = () =>
  RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    algorithm: 'sliding',
    keyGenerator: (req) => `login:${req.ip}:${req.body?.username || 'unknown'}`,
  });
