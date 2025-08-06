import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { DatabaseConnectionError, DatabaseCreationError, StorageError, ConfigurationError } from './installation.errors';
import { User } from '../entities/user.entity';
import { Game } from '../entities/game.entity';

export interface InstallationConfig {
  database: {
    type: 'postgres' | 'sqlite';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database: string;
    path?: string; // For SQLite
  };
  admin: {
    username: string;
    password: string;
    email: string;
  };
  server: {
    port: number;
    host: string;
    domain?: string;
  };
  storage: {
    path: string;
    maxFileSize: number;
  };
}

@Injectable()
export class InstallationService {
  private readonly logger = new Logger(InstallationService.name);
  private readonly configPath = path.join(process.cwd(), '.env');
  private readonly installFlagPath = path.join(process.cwd(), '.installed');

  constructor(private readonly configService: ConfigService) {}

  async isInstalled(): Promise<boolean> {
    return fs.existsSync(this.installFlagPath);
  }

  async testDatabaseConnection(config: InstallationConfig['database']): Promise<boolean> {
    try {
      let dataSource: DataSource;

      if (config.type === 'sqlite') {
        dataSource = new DataSource({
          type: 'better-sqlite3',
          database: config.path || config.database,
          synchronize: true,
        });
      } else {
        dataSource = new DataSource({
          type: 'postgres',
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: 'postgres', // Connect to default database first
        });
      }

      await dataSource.initialize();
      await dataSource.destroy();
      return true;
    } catch (error) {
      this.logger.error('Database connection test failed:', error);
      return false;
    }
  }

  async testDatabaseConnectionWithErrors(config: InstallationConfig['database']): Promise<void> {
    try {
      let dataSource: DataSource;

      if (config.type === 'sqlite') {
        dataSource = new DataSource({
          type: 'better-sqlite3',
          database: config.path || config.database,
          synchronize: true,
        });
      } else {
        dataSource = new DataSource({
          type: 'postgres',
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: 'postgres', // Connect to default database first
        });
      }

      await dataSource.initialize();
      await dataSource.destroy();
    } catch (error) {
      this.logger.error('Database connection test failed:', error);
      throw new DatabaseConnectionError(
        `Failed to connect to ${config.type} database`,
        { 
          type: config.type,
          host: config.host,
          port: config.port,
          database: config.database,
          error: error.message 
        }
      );
    }
  }

  async createDatabase(config: InstallationConfig['database']): Promise<void> {
    if (config.type === 'sqlite') {
      // For SQLite, just ensure the directory exists
      const dbPath = config.path || config.database;
      const dbDir = path.dirname(dbPath);
      
      if (!fs.existsSync(dbDir)) {
        fs.ensureDirSync(dbDir);
      }
      
      this.logger.log(`SQLite database will be created at: ${dbPath}`);
      return;
    }

    // PostgreSQL database creation
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: 'postgres', // Connect to default postgres database
    });

    try {
      await adminDataSource.initialize();
      
      // Check if database exists
      const result = await adminDataSource.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [config.database]
      );

      if (result.length === 0) {
        // Create database
        await adminDataSource.query(`CREATE DATABASE "${config.database}"`);
        this.logger.log(`Database "${config.database}" created successfully`);
      } else {
        this.logger.log(`Database "${config.database}" already exists`);
      }

      await adminDataSource.destroy();
    } catch (error) {
      await adminDataSource.destroy();
      throw new Error(`Failed to create database: ${error.message}`);
    }
  }

  async initializeDatabase(config: InstallationConfig): Promise<void> {
    let dataSource: DataSource;

    if (config.database.type === 'sqlite') {
      dataSource = new DataSource({
        type: 'better-sqlite3',
        database: config.database.path || config.database.database,
        entities: [User, Game],
        synchronize: true,
        logging: false,
      });
    } else {
      dataSource = new DataSource({
        type: 'postgres',
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.database,
        entities: [User, Game],
        synchronize: true,
        logging: false,
      });
    }

    try {
      await dataSource.initialize();
      
      // Create admin user using TypeORM
      const hashedPassword = await bcryptjs.hash(config.admin.password, 10);
      
      const userRepository = dataSource.getRepository(User);
      
      // Check if admin user already exists
      let adminUser = await userRepository.findOne({
        where: { username: config.admin.username }
      });
      
      if (adminUser) {
        // Update existing admin user
        adminUser.email = config.admin.email;
        adminUser.password = hashedPassword;
        adminUser.role = 'admin';
        adminUser.isActive = true;
        await userRepository.save(adminUser);
        this.logger.log('Admin user updated');
      } else {
        // Create new admin user
        adminUser = userRepository.create({
          username: config.admin.username,
          email: config.admin.email,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
        });
        await userRepository.save(adminUser);
        this.logger.log('Admin user created');
      }

      this.logger.log('Database initialized and admin user ready');
      await dataSource.destroy();
    } catch (error) {
      await dataSource.destroy();
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  async createConfigFile(config: InstallationConfig): Promise<void> {
    let envContent: string;

    if (config.database.type === 'sqlite') {
      envContent = `
# Database Configuration
DB_TYPE=sqlite
DB_DATABASE=${config.database.path || config.database.database}

# Server Configuration
SERVER_PORT=${config.server.port}
SERVER_HOST=${config.server.host}
${config.server.domain ? `SERVER_DOMAIN=${config.server.domain}` : ''}

# Storage Configuration
STORAGE_PATH=${config.storage.path}
MAX_FILE_SIZE=${config.storage.maxFileSize}

# Game Library Configuration
DOWNLOAD_DIR=${path.join(config.storage.path, 'downloads')}
INSTALLER_DIR=${path.join(config.storage.path, 'installers')}
INSTALLED_DIR=${path.join(config.storage.path, 'installed')}
STEAM_ASSETS_DIR=${path.join(config.storage.path, 'steam-assets')}

# Itch.io Integration
ITCHIO_ENABLED=false
# ITCHIO_API_KEY=your_itchio_api_key_here

# Steam Integration
STEAM_INTEGRATION_ENABLED=false
STEAM_AUTO_ADD_SHORTCUTS=false

# Security
JWT_SECRET=${this.generateRandomSecret()}
BCRYPT_ROUNDS=10

# Installation
INSTALLED=true
INSTALLATION_DATE=${new Date().toISOString()}
`.trim();
    } else {
      envContent = `
# Database Configuration
DB_TYPE=postgres
DB_HOST=${config.database.host}
DB_PORT=${config.database.port}
DB_USERNAME=${config.database.username}
DB_PASSWORD=${config.database.password}
DB_DATABASE=${config.database.database}

# Server Configuration
SERVER_PORT=${config.server.port}
SERVER_HOST=${config.server.host}
${config.server.domain ? `SERVER_DOMAIN=${config.server.domain}` : ''}

# Storage Configuration
STORAGE_PATH=${config.storage.path}
MAX_FILE_SIZE=${config.storage.maxFileSize}

# Game Library Configuration
DOWNLOAD_DIR=${path.join(config.storage.path, 'downloads')}
INSTALLER_DIR=${path.join(config.storage.path, 'installers')}
INSTALLED_DIR=${path.join(config.storage.path, 'installed')}
STEAM_ASSETS_DIR=${path.join(config.storage.path, 'steam-assets')}

# Itch.io Integration
ITCHIO_ENABLED=false
# ITCHIO_API_KEY=your_itchio_api_key_here

# Steam Integration
STEAM_INTEGRATION_ENABLED=false
STEAM_AUTO_ADD_SHORTCUTS=false

# Security
JWT_SECRET=${this.generateRandomSecret()}
BCRYPT_ROUNDS=10

# Installation
INSTALLED=true
INSTALLATION_DATE=${new Date().toISOString()}
`.trim();
    }

    await fs.writeFile(this.configPath, envContent);
    this.logger.log('Configuration file created');
  }

  async createStorageDirectories(storagePath: string): Promise<void> {
    const directories = [
      storagePath,
      path.join(storagePath, 'games'),
      path.join(storagePath, 'covers'),
      path.join(storagePath, 'temp'),
      path.join(storagePath, 'backups'),
      // New directories for itch.io integration
      path.join(storagePath, 'downloads'),      // Raw itch.io downloads
      path.join(storagePath, 'installers'),     // Unpacked installers
      path.join(storagePath, 'installed'),      // Installed games
      path.join(storagePath, 'steam-assets'),   // Steam shortcuts & icons
      path.join(storagePath, 'metadata'),       // Cached metadata
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
    }

    this.logger.log('Storage directories created for game library system');
  }

  private async cleanupStorageDirectories(storagePath: string): Promise<void> {
    try {
      if (await fs.pathExists(storagePath)) {
        await fs.remove(storagePath);
        this.logger.log('Storage directories cleaned up');
      }
    } catch (error) {
      this.logger.error('Failed to cleanup storage directories:', error);
    }
  }

  private async validateInstallationConfig(config: InstallationConfig): Promise<void> {
    const errors: string[] = [];

    // Database validation
    if (config.database.type === 'postgres') {
      if (!config.database.host) errors.push('PostgreSQL host is required');
      if (!config.database.username) errors.push('PostgreSQL username is required');
      if (!config.database.password) errors.push('PostgreSQL password is required');
      if (!config.database.port || config.database.port < 1 || config.database.port > 65535) {
        errors.push('PostgreSQL port must be between 1 and 65535');
      }
    } else if (config.database.type === 'sqlite') {
      const dbPath = config.database.path || config.database.database;
      const dbDir = path.dirname(path.resolve(dbPath));
      
      try {
        await fs.access(dbDir, fs.constants.W_OK);
      } catch {
        errors.push(`SQLite database directory is not writable: ${dbDir}`);
      }
    }

    if (!config.database.database) errors.push('Database name is required');

    // Admin validation
    if (!config.admin.username || config.admin.username.length < 3) {
      errors.push('Admin username must be at least 3 characters');
    }
    if (!config.admin.password || config.admin.password.length < 8) {
      errors.push('Admin password must be at least 8 characters');
    }
    if (!config.admin.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.admin.email)) {
      errors.push('Valid admin email is required');
    }

    // Server validation
    if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
      errors.push('Server port must be between 1 and 65535');
    }
    if (!config.server.host) errors.push('Server host is required');

    // Storage validation
    if (!config.storage.path) errors.push('Storage path is required');
    if (!config.storage.maxFileSize || config.storage.maxFileSize < 1048576) {
      errors.push('Max file size must be at least 1MB');
    }

    // Check if storage path is writable
    try {
      const parentDir = path.dirname(path.resolve(config.storage.path));
      await fs.access(parentDir, fs.constants.W_OK);
    } catch {
      errors.push(`Storage parent directory is not writable: ${path.dirname(config.storage.path)}`);
    }

    if (errors.length > 0) {
      throw new ConfigurationError('Configuration validation failed', { errors });
    }
  }

  async completeInstallation(config: InstallationConfig): Promise<void> {
    const rollbackActions: (() => Promise<void>)[] = [];
    
    try {
      this.logger.log('Starting installation process...');
      
      // Step 0: Validate configuration
      this.logger.log('Validating configuration...');
      await this.validateInstallationConfig(config);
      
      // Step 1: Test database connection
      this.logger.log('Testing database connection...');
      await this.testDatabaseConnectionWithErrors(config.database);
      
      // Step 2: Create database (PostgreSQL only)
      this.logger.log('Creating database...');
      await this.createDatabase(config.database);
      
      // Step 3: Initialize database and create admin user
      this.logger.log('Initializing database schema...');
      await this.initializeDatabase(config);
      rollbackActions.push(async () => {
        this.logger.warn('Rolling back database initialization...');
        // Could implement database cleanup here
      });

      // Step 4: Create storage directories
      this.logger.log('Creating storage directories...');
      await this.createStorageDirectories(config.storage.path);
      rollbackActions.push(async () => {
        this.logger.warn('Cleaning up storage directories...');
        await this.cleanupStorageDirectories(config.storage.path);
      });

      // Step 5: Create configuration file
      this.logger.log('Creating configuration file...');
      await this.createConfigFile(config);
      rollbackActions.push(async () => {
        this.logger.warn('Removing configuration file...');
        if (await fs.pathExists(this.configPath)) {
          await fs.remove(this.configPath);
        }
      });

      // Step 6: Mark installation as complete
      this.logger.log('Finalizing installation...');
      await fs.writeFile(this.installFlagPath, JSON.stringify({
        completed: true,
        date: new Date().toISOString(),
        version: '1.0.0',
        config: {
          database: { type: config.database.type },
          storage: { path: config.storage.path },
          admin: { username: config.admin.username }
        }
      }, null, 2));

      this.logger.log('Installation completed successfully');
    } catch (error) {
      this.logger.error('Installation failed, performing rollback...', error);
      
      // Execute rollback actions in reverse order
      for (const rollback of rollbackActions.reverse()) {
        try {
          await rollback();
        } catch (rollbackError) {
          this.logger.error('Rollback action failed:', rollbackError);
        }
      }
      
      throw new Error(`Installation failed: ${error.message}`);
    }
  }

  async getSystemRequirements(): Promise<{
    node: { current: string; required: string; satisfied: boolean };
    disk: { available: string; required: string; satisfied: boolean };
    memory: { available: string; required: string; satisfied: boolean };
  }> {
    const nodeVersion = process.version;
    const requiredNodeVersion = '18.0.0';
    
    // Basic checks
    const stats = await fs.stat(process.cwd());
    const memoryUsage = process.memoryUsage();

    return {
      node: {
        current: nodeVersion,
        required: `>=${requiredNodeVersion}`,
        satisfied: this.compareVersions(nodeVersion.slice(1), requiredNodeVersion) >= 0
      },
      disk: {
        available: '10 GB', // Simplified for demo
        required: '1 GB',
        satisfied: true
      },
      memory: {
        available: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        required: '512 MB',
        satisfied: memoryUsage.heapTotal > 512 * 1024 * 1024
      }
    };
  }

  private generateRandomSecret(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }
}
