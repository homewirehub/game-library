import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { GamesModule } from './modules/games/games.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { InstallationModule } from './installation/installation.module';
import { HealthModule } from './health/health.module';
import { InstallationGuard } from './installation/installation.guard';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { EnvironmentService } from './config/environment.service';
import { TaskQueueService } from './queue/task-queue.service';
import { RateLimitService } from './security/rate-limit.service';
import { Game } from './entities/game.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService, environmentService: EnvironmentService) => {
        const dbConfig = environmentService.getDatabaseConfig();
        
        if (dbConfig.type === 'postgres') {
          return {
            type: 'postgres',
            host: dbConfig.host,
            port: dbConfig.port,
            username: dbConfig.username,
            password: dbConfig.password,
            database: dbConfig.database,
            ssl: dbConfig.ssl,
            entities: [Game],
            synchronize: !environmentService.isProduction(),
            logging: environmentService.isDevelopment(),
            maxQueryExecutionTime: 1000,
            extra: {
              max: dbConfig.maxConnections,
            },
          };
        } else {
          return {
            type: 'sqlite',
            database: dbConfig.path || dbConfig.database,
            entities: [Game],
            synchronize: true,
            logging: environmentService.isDevelopment(),
          };
        }
      },
      inject: [ConfigService, EnvironmentService],
    }),
    InstallationModule,
    GamesModule,
    MetadataModule,
    HealthModule,
  ],
  providers: [
    EnvironmentService,
    TaskQueueService,
    RateLimitService,
    {
      provide: APP_GUARD,
      useClass: InstallationGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
