import { Controller, Get } from '@nestjs/common';
import { RedisRateLimitService } from './redis-rate-limit.service';
import { RateLimitService } from './rate-limit.service';

@Controller('api/admin/rate-limit')
export class RateLimitController {
  constructor(
    private readonly redisRateLimitService: RedisRateLimitService,
    private readonly fallbackRateLimitService: RateLimitService,
  ) {}

  @Get('stats')
  async getStats() {
    const redisStats = await this.redisRateLimitService.getStats();
    const fallbackStats = this.fallbackRateLimitService.getStats();
    
    return {
      redis: redisStats,
      fallback: fallbackStats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  async getHealth() {
    const redisHealth = await this.redisRateLimitService.healthCheck();
    
    return {
      status: redisHealth.redis ? 'healthy' : 'degraded',
      services: {
        redis: redisHealth.redis ? 'up' : 'down',
        fallback: redisHealth.fallback ? 'up' : 'down',
      },
      message: redisHealth.redis 
        ? 'Rate limiting operating normally with Redis'
        : 'Rate limiting operating in fallback mode (in-memory)',
      timestamp: new Date().toISOString(),
    };
  }
}
