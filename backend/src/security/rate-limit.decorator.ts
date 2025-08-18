import { applyDecorators, UseGuards, SetMetadata, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

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
  applyDecorators(SetMetadata(RATE_LIMIT_KEY, options), UseGuards(RateLimitGuard));

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
  keyGenerator: (_req) => `login:${_req.ip}:${_req.body?.username || 'unknown'}`,
  });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(_context: ExecutionContext): boolean {
    // Implement your rate limiting logic here
    // For now, always allow
    return true;
  }
}
