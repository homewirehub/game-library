import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true; // No rate limiting applied
    }

    const request = context.switchToHttp().getRequest();

    // Skip if condition is met
    if (options.skipIf && options.skipIf(request)) {
      return true;
    }

    // Generate key
    const key = options.keyGenerator 
      ? options.keyGenerator(request)
      : `${request.ip}:${request.route?.path || request.url}`;

    const result = await this.rateLimitService.checkLimit(key, {
      windowMs: options.windowMs,
      maxRequests: options.maxRequests,
      blockDurationMs: options.blockDurationMs,
    });

    if (!result.allowed) {
      const message = options.message || 
        `Rate limit exceeded. ${result.blocked ? 'Temporarily blocked.' : 'Try again later.'}`;
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message,
          error: 'Too Many Requests',
          remainingRequests: result.remainingRequests,
          resetTime: result.resetTime,
          blocked: result.blocked,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', options.maxRequests);
    response.setHeader('X-RateLimit-Remaining', result.remainingRequests);
    response.setHeader('X-RateLimit-Reset', result.resetTime);

    return true;
  }
}
