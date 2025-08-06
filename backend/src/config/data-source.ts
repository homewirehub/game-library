import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

// Create DataSource for TypeORM CLI
const dbType = configService.get('DB_TYPE', 'sqlite');

export const AppDataSource = new DataSource(
  dbType === 'postgres' 
    ? {
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: ['src/**/*.entity.ts'],
        migrations: ['src/migrations/*.ts'],
        subscribers: ['src/**/*.subscriber.ts'],
        migrationsTableName: 'typeorm_migrations',
        migrationsRun: false,
        synchronize: false,
        logging: ['error', 'warn', 'migration'],
      }
    : {
        type: 'better-sqlite3',
        database: configService.get('DB_PATH', './gamelib.db'),
        entities: ['src/**/*.entity.ts'],
        migrations: ['src/migrations/*.ts'],
        subscribers: ['src/**/*.subscriber.ts'],
        migrationsTableName: 'typeorm_migrations',
        migrationsRun: false,
        synchronize: false,
        logging: ['error', 'warn', 'migration'],
      }
);
