import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  type: 'postgres' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  path?: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface RedisConfig {
  url: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  corsOrigin: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export interface StorageConfig {
  path: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  tempDir: string;
  backupDir: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  domain?: string;
  environment: 'development' | 'production' | 'test';
}

@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService) {}

  getDatabaseConfig(): DatabaseConfig {
    const type = this.configService.get<'postgres' | 'sqlite'>('DB_TYPE', 'sqlite');
    
    const baseConfig = {
      type,
      database: this.configService.get<string>('DB_DATABASE', 'gamelib.db'),
    };

    if (type === 'postgres') {
      return {
        ...baseConfig,
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 5432),
        username: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
        ssl: this.configService.get<boolean>('DB_SSL', false),
        maxConnections: this.configService.get<number>('DB_MAX_CONNECTIONS', 10),
      };
    } else {
      return {
        ...baseConfig,
        path: this.configService.get<string>('DB_PATH', './data/gamelib.db'),
      };
    }
  }

  getSecurityConfig(): SecurityConfig {
    return {
      jwtSecret: this.configService.get<string>('JWT_SECRET', this.generateDefaultSecret()),
      jwtExpiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      bcryptRounds: this.configService.get<number>('BCRYPT_ROUNDS', 12),
      corsOrigin: this.configService.get<string>('CORS_ORIGIN', 'http://localhost:3000,http://localhost:5173')
        .split(','),
      rateLimitWindowMs: this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
      rateLimitMax: this.configService.get<number>('RATE_LIMIT_MAX', 100),
    };
  }

  getRedisConfig(): RedisConfig {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (redisUrl) {
      return {
        url: redisUrl,
        keyPrefix: this.configService.get<string>('REDIS_KEY_PREFIX', 'gamelib:'),
        lazyConnect: true,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      };
    }

    return {
      url: '', // Will construct from individual parts
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      keyPrefix: this.configService.get<string>('REDIS_KEY_PREFIX', 'gamelib:'),
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    };
  }

  getStorageConfig(): StorageConfig {
    return {
      path: this.configService.get<string>('STORAGE_PATH', './storage'),
      maxFileSize: this.configService.get<number>('MAX_FILE_SIZE', 5 * 1024 * 1024 * 1024), // 5GB
      allowedFileTypes: this.configService.get<string>('ALLOWED_FILE_TYPES', '.zip,.rar,.7z,.iso,.exe')
        .split(','),
      tempDir: this.configService.get<string>('TEMP_DIR', './storage/temp'),
      backupDir: this.configService.get<string>('BACKUP_DIR', './storage/backups'),
    };
  }

  getServerConfig(): ServerConfig {
    return {
      port: this.configService.get<number>('SERVER_PORT', 3000),
      host: this.configService.get<string>('SERVER_HOST', '0.0.0.0'),
      domain: this.configService.get<string>('SERVER_DOMAIN'),
      environment: this.configService.get<'development' | 'production' | 'test'>('NODE_ENV', 'development'),
    };
  }

  getMetadataConfig() {
    return {
      igdb: {
        clientId: this.configService.get<string>('IGDB_CLIENT_ID'),
        clientSecret: this.configService.get<string>('IGDB_CLIENT_SECRET'),
        enabled: Boolean(this.configService.get<string>('IGDB_CLIENT_ID')),
      },
      rawg: {
        apiKey: this.configService.get<string>('RAWG_API_KEY'),
        enabled: Boolean(this.configService.get<string>('RAWG_API_KEY')),
      },
      vndb: {
        enabled: true, // VNDB doesn't require API key
      },
      steam: {
        enabled: true, // Steam API is open
      },
    };
  }

  isInstalled(): boolean {
    return this.configService.get<boolean>('INSTALLED', false);
  }

  isProduction(): boolean {
    return this.getServerConfig().environment === 'production';
  }

  isDevelopment(): boolean {
    return this.getServerConfig().environment === 'development';
  }

  private generateDefaultSecret(): string {
    console.warn('WARNING: Using default JWT secret. Please set JWT_SECRET in environment variables.');
    return 'default-development-secret-please-change-in-production';
  }
}
