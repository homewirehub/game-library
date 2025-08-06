import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { IsIn, IsNumber, IsString, IsOptional, Min, Max, IsEmail, MinLength } from 'class-validator';
import { InstallationService, InstallationConfig } from './installation.service';

export class DatabaseConfigDto {
  @IsIn(['postgres', 'sqlite'])
  type: 'postgres' | 'sqlite';

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  database: string;

  @IsOptional()
  @IsString()
  path?: string; // For SQLite
}

export class AdminConfigDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEmail()
  email: string;
}

export class ServerConfigDto {
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  host: string;

  @IsOptional()
  @IsString()
  domain?: string;
}

export class StorageConfigDto {
  @IsString()
  path: string;

  @IsNumber()
  @Min(1048576) // Minimum 1MB
  maxFileSize: number;
}

export class InstallationConfigDto {
  database: DatabaseConfigDto;
  admin: AdminConfigDto;
  server: ServerConfigDto;
  storage: StorageConfigDto;
}

@Controller('api/installation')
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Get('status')
  async getInstallationStatus() {
    const isInstalled = await this.installationService.isInstalled();
    return {
      installed: isInstalled,
      message: isInstalled ? 'System is already installed' : 'System requires installation',
    };
  }

  @Get('requirements')
  async getSystemRequirements() {
    try {
      const requirements = await this.installationService.getSystemRequirements();
      return {
        success: true,
        requirements,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to check system requirements',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test-database')
  async testDatabaseConnection(@Body() config: DatabaseConfigDto) {
    try {
      const canConnect = await this.installationService.testDatabaseConnection(config);
      return {
        success: canConnect,
        message: canConnect ? 'Database connection successful' : 'Database connection failed',
      };
    } catch (error) {
      return {
        success: false,
        message: `Database connection failed: ${error.message}`,
      };
    }
  }

  @Post('install')
  async performInstallation(@Body() config: InstallationConfigDto) {
    try {
      // Check if already installed
      const isInstalled = await this.installationService.isInstalled();
      if (isInstalled) {
        throw new HttpException(
          'System is already installed',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate configuration
      this.validateInstallationConfig(config);

      // Perform installation
      await this.installationService.completeInstallation(config);

      return {
        success: true,
        message: 'Installation completed successfully',
        nextSteps: [
          'Your Game Library is now ready to use',
          'You can log in with your admin credentials',
          'Upload your first game to get started',
        ],
      };
    } catch (error) {
      throw new HttpException(
        `Installation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private validateInstallationConfig(config: InstallationConfigDto): void {
    // Database validation
    if (config.database.type === 'postgres') {
      if (!config.database.host || !config.database.username || !config.database.database) {
        throw new Error('PostgreSQL database configuration is incomplete');
      }

      if (!config.database.port || config.database.port < 1 || config.database.port > 65535) {
        throw new Error('Invalid database port');
      }
    } else if (config.database.type === 'sqlite') {
      if (!config.database.database && !config.database.path) {
        throw new Error('SQLite database path is required');
      }
    } else {
      throw new Error('Invalid database type');
    }

    // Admin validation
    if (!config.admin.username || !config.admin.password || !config.admin.email) {
      throw new Error('Admin configuration is incomplete');
    }

    if (config.admin.password.length < 8) {
      throw new Error('Admin password must be at least 8 characters long');
    }

    if (!this.isValidEmail(config.admin.email)) {
      throw new Error('Invalid admin email address');
    }

    // Server validation
    if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
      throw new Error('Invalid server port');
    }

    // Storage validation
    if (!config.storage.path) {
      throw new Error('Storage path is required');
    }

    if (!config.storage.maxFileSize || config.storage.maxFileSize < 1) {
      throw new Error('Invalid max file size');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
