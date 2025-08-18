import { z } from 'zod';

// Environment validation schema
export const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  
  // Database
  DB_TYPE: z.enum(['sqlite', 'postgres']).default('sqlite'),
  DB_PATH: z.string().optional(), // For SQLite
  DB_SQLITE_DRIVER: z.enum(['sqlite', 'better-sqlite3']).default('better-sqlite3').optional(),
  DB_HOST: z.string().optional(), // For PostgreSQL
  DB_PORT: z.coerce.number().min(1).max(65535).optional(),
  DB_USERNAME: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_SYNCHRONIZE: z.coerce.boolean().default(false), // NEVER true in production
  
  // Redis (for rate limiting)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().min(0).max(15).default(0),
  
  // JWT Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // File Upload
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().positive().default(1073741824), // 1GB default
  ALLOWED_FILE_TYPES: z.string().default('.zip,.rar,.7z,.tar.gz'),
  
  // External APIs
  STEAM_API_KEY: z.string().optional(),
  IGDB_CLIENT_ID: z.string().optional(),
  IGDB_CLIENT_SECRET: z.string().optional(),
  RAWG_API_KEY: z.string().optional(),
  
  // Security
  CORS_ORIGIN: z.union([
    z.string().url(),
    z.literal('*'),
    z.array(z.string().url())
  ]).default('http://localhost:5173'),
  
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
  
  // Rate Limiting
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_REDIS_ENABLED: z.coerce.boolean().default(true),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Installation
  REQUIRE_INSTALLATION: z.coerce.boolean().default(true),
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
}).refine((data) => {
  // Custom validation rules
  
  // If using PostgreSQL, require connection details
  if (data.DB_TYPE === 'postgres') {
    return data.DB_HOST && data.DB_PORT && data.DB_USERNAME && data.DB_NAME;
  }
  
  // If using SQLite, require DB_PATH
  if (data.DB_TYPE === 'sqlite') {
    return data.DB_PATH;
  }
  
  return true;
}, {
  message: "Database configuration is incomplete for the selected DB_TYPE",
}).refine((data) => {
  // Production environment validation
  if (data.NODE_ENV === 'production') {
    // Never allow synchronize in production
    if (data.DB_SYNCHRONIZE) {
      return false;
    }
    
    // Require strong JWT secret in production
    if (data.JWT_SECRET.length < 64) {
      return false;
    }
    
    // Require specific CORS origins (not *)
    if (data.CORS_ORIGIN === '*') {
      return false;
    }
  }
  
  return true;
}, {
  message: "Production environment requires stricter security settings",
}).refine((data) => {
  // Redis validation
  if (data.RATE_LIMIT_REDIS_ENABLED && !data.REDIS_URL) {
    // If Redis rate limiting is enabled but no URL, require individual settings
    return data.REDIS_HOST && data.REDIS_PORT;
  }
  
  return true;
}, {
  message: "Redis configuration is incomplete for rate limiting",
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validation function
export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);
    
    // Log configuration summary (without secrets)
    console.log('🔧 Environment Configuration:');
    console.log(`   NODE_ENV: ${env.NODE_ENV}`);
    console.log(`   PORT: ${env.PORT}`);
    console.log(`   DB_TYPE: ${env.DB_TYPE}`);
    console.log(`   REDIS_ENABLED: ${env.RATE_LIMIT_REDIS_ENABLED}`);
    console.log(`   CORS_ORIGIN: ${env.CORS_ORIGIN}`);
    console.log(`   UPLOAD_PATH: ${env.UPLOAD_PATH}`);
    console.log(`   MAX_FILE_SIZE: ${Math.round(env.MAX_FILE_SIZE / 1024 / 1024)}MB`);
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((issue) => {
        console.error(`   ${issue.path.join('.')}: ${issue.message}`);
      });
      console.error('\n💡 Check your .env file and ensure all required variables are set.');
      console.error('💡 See .env.example for reference configuration.');
    } else {
      console.error('❌ Unexpected error during environment validation:', error);
    }
    
    process.exit(1);
  }
}

// Development environment defaults
export const DEV_ENV_EXAMPLE = {
  NODE_ENV: 'development',
  PORT: '3001',
  
  // Database (SQLite for development)
  DB_TYPE: 'sqlite',
  DB_PATH: './gamelib.db',
  DB_SYNCHRONIZE: 'false', // Always false, use migrations
  
  // Redis
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  RATE_LIMIT_REDIS_ENABLED: 'true',
  
  // JWT (generate a secure secret for production!)
  JWT_SECRET: 'your-super-secure-jwt-secret-key-min-32-chars-for-development-only',
  JWT_EXPIRES_IN: '24h',
  
  // File uploads
  UPLOAD_PATH: './uploads',
  MAX_FILE_SIZE: '1073741824', // 1GB
  ALLOWED_FILE_TYPES: '.zip,.rar,.7z,.tar.gz',
  
  // CORS
  CORS_ORIGIN: 'http://localhost:5173',
  
  // Optional API keys (for metadata fetching)
  // STEAM_API_KEY: 'your-steam-api-key',
  // IGDB_CLIENT_ID: 'your-igdb-client-id',
  // IGDB_CLIENT_SECRET: 'your-igdb-client-secret',
  // RAWG_API_KEY: 'your-rawg-api-key',
  
  // Security
  BCRYPT_ROUNDS: '12',
  
  // Installation
  REQUIRE_INSTALLATION: 'true',
  // ADMIN_USERNAME: 'admin',
  // ADMIN_PASSWORD: 'secure-password',
  
  // Logging
  LOG_LEVEL: 'info',
};

// Production environment template
export const PROD_ENV_TEMPLATE = {
  NODE_ENV: 'production',
  PORT: '3001',
  
  // Database (PostgreSQL recommended for production)
  DB_TYPE: 'postgres',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'gamelib_user',
  DB_PASSWORD: 'CHANGE_ME_STRONG_PASSWORD',
  DB_NAME: 'gamelib_prod',
  DB_SYNCHRONIZE: 'false', // NEVER true in production
  
  // Redis (required for production rate limiting)
  REDIS_URL: 'redis://localhost:6379',
  RATE_LIMIT_REDIS_ENABLED: 'true',
  
  // JWT (MUST be changed for production!)
  JWT_SECRET: 'CHANGE_ME_SUPER_SECURE_64_CHAR_MINIMUM_JWT_SECRET_FOR_PRODUCTION',
  JWT_EXPIRES_IN: '1h', // Shorter for production
  
  // File uploads
  UPLOAD_PATH: '/app/uploads',
  MAX_FILE_SIZE: '2147483648', // 2GB
  ALLOWED_FILE_TYPES: '.zip,.rar,.7z,.tar.gz',
  
  // CORS (specific origins only)
  CORS_ORIGIN: 'https://your-domain.com',
  
  // API keys
  STEAM_API_KEY: 'your-production-steam-api-key',
  IGDB_CLIENT_ID: 'your-production-igdb-client-id',
  IGDB_CLIENT_SECRET: 'your-production-igdb-client-secret',
  RAWG_API_KEY: 'your-production-rawg-api-key',
  
  // Security
  BCRYPT_ROUNDS: '14', // Higher for production
  
  // Installation
  REQUIRE_INSTALLATION: 'true',
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'CHANGE_ME_SECURE_ADMIN_PASSWORD',
  
  // Logging
  LOG_LEVEL: 'warn', // Less verbose in production
};
