import { Module } from '@nestjs/common';
import { RedisConfigModule } from '../redis/redis.module';
import { RateLimitService } from './rate-limit.service';
import { RedisRateLimitService } from './redis-rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitController } from './rate-limit.controller';

@Module({
  imports: [RedisConfigModule],
  controllers: [RateLimitController],
  providers: [
    RateLimitService, // Keep as fallback
    RedisRateLimitService, // Primary Redis-backed service
    RateLimitGuard,
  ],
  exports: [
    RateLimitService,
    RedisRateLimitService,
    RateLimitGuard,
  ],
})
export class SecurityModule {}
