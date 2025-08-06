import { Module } from '@nestjs/common';
import { RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvironmentService } from '../config/environment.service';

@Module({
  imports: [
    IoRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const environmentService = new EnvironmentService(configService);
        const redisConfig = environmentService.getRedisConfig();

        // Construct Redis connection options
        if (redisConfig.url) {
          return {
            type: 'single',
            url: redisConfig.url,
            options: {
              keyPrefix: redisConfig.keyPrefix,
              lazyConnect: redisConfig.lazyConnect,
              retryDelayOnFailover: redisConfig.retryDelayOnFailover,
              maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
            },
          };
        }

        return {
          type: 'single',
          options: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            db: redisConfig.db,
            keyPrefix: redisConfig.keyPrefix,
            lazyConnect: redisConfig.lazyConnect,
            retryDelayOnFailover: redisConfig.retryDelayOnFailover,
            maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [IoRedisModule],
})
export class RedisConfigModule {}
