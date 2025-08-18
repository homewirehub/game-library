import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { GamesModule } from './modules/games/games.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { InstallationModule } from './installation/installation.module';
import { InstallationGuard } from './installation/installation.guard';
import { ItchModule } from './modules/itch/itch.module';
import { SteamModule } from './modules/steam/steam.module';
import { SecurityModule } from './security/security.module';
import { Game } from './entities/game.entity';
import { User } from './entities/user.entity';
import { HealthModule } from './health/health.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule,
    HealthModule,
  MetadataModule,
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'sqlite');
        const sqliteDriver = configService.get('DB_SQLITE_DRIVER', 'better-sqlite3'); // 'better-sqlite3' | 'sqlite'
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_NAME'),
            entities: [Game, User],
            synchronize: configService.get('DB_SYNCHRONIZE', false), // Never true in production
            logging: configService.get('NODE_ENV') === 'development',
            ssl:
              configService.get('NODE_ENV') === 'production'
                ? { rejectUnauthorized: false }
                : false,
          };
        } else {
          // SQLite configuration: allow choosing driver for tests vs prod
          if (sqliteDriver === 'sqlite') {
            return {
              type: 'sqlite',
              database: configService.get('DB_PATH', 'gamelib.db'),
              entities: [Game, User],
              synchronize: configService.get('DB_SYNCHRONIZE', false), // Use migrations instead
              logging: configService.get('NODE_ENV') === 'development',
            } as any;
          }
          return {
            type: 'better-sqlite3',
            database: configService.get('DB_PATH', 'gamelib.db'),
            entities: [Game, User],
            synchronize: configService.get('DB_SYNCHRONIZE', false), // Use migrations instead
            logging: configService.get('NODE_ENV') === 'development',
          } as any;
        }
      },
      inject: [ConfigService],
    }),
    InstallationModule,
    SecurityModule,
    GamesModule,
    ...(process.env.ITCH_ENABLED === 'true' ? [ItchModule] : []),
    ...(process.env.STEAM_ENABLED === 'true' ? [SteamModule] : []),
  ],
  providers: [
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
