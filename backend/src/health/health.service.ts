import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { EnvironmentService } from '../config/environment.service';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    database: HealthCheck;
    storage: HealthCheck;
    installation: HealthCheck;
    metadata: HealthCheck;
    disk: HealthCheck;
    memory: HealthCheck;
  };
  version: string;
  uptime: number;
  environment: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly environmentService: EnvironmentService,
  ) {}

  async getHealth(): Promise<SystemHealth> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkStorage(),
      this.checkInstallation(),
      this.checkMetadata(),
      this.checkDiskSpace(),
      this.checkMemory(),
    ]);

    const [database, storage, installation, metadata, disk, memory] = checks.map(
      (result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const checkNames = ['database', 'storage', 'installation', 'metadata', 'disk', 'memory'];
          return {
            status: 'unhealthy' as const,
            message: `Failed to check ${checkNames[index]}: ${result.reason?.message || 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          };
        }
      }
    );

    const allChecks = { database, storage, installation, metadata, disk, memory };
    const overallStatus = this.determineOverallStatus(allChecks);

    return {
      status: overallStatus,
      checks: allChecks,
      version: '1.0.0',
      uptime: process.uptime(),
      environment: this.environmentService.getServerConfig().environment,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      const dbConfig = this.environmentService.getDatabaseConfig();
      let dataSource: DataSource;

      if (dbConfig.type === 'sqlite') {
        dataSource = new DataSource({
          type: 'sqlite',
          database: dbConfig.path || dbConfig.database,
        });
      } else {
        dataSource = new DataSource({
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
        });
      }

      await dataSource.initialize();
      
      // Test a simple query
      const result = await dataSource.query('SELECT 1 as test');
      await dataSource.destroy();

      return {
        status: 'healthy',
        message: `${dbConfig.type} database connection successful`,
        details: {
          type: dbConfig.type,
          database: dbConfig.database,
          queryResult: result[0]?.test === 1,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkStorage(): Promise<HealthCheck> {
    try {
      const storageConfig = this.environmentService.getStorageConfig();
      const storagePath = storageConfig.path;

      // Check if storage directory exists and is writable
      await fs.access(storagePath, fs.constants.F_OK | fs.constants.W_OK);

      // Check subdirectories
      const requiredDirs = ['games', 'covers', 'temp', 'backups'];
      const missingDirs = [];

      for (const dir of requiredDirs) {
        const dirPath = path.join(storagePath, dir);
        if (!(await fs.pathExists(dirPath))) {
          missingDirs.push(dir);
        }
      }

      if (missingDirs.length > 0) {
        return {
          status: 'warning',
          message: `Storage accessible but missing directories: ${missingDirs.join(', ')}`,
          details: { missingDirectories: missingDirs },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: 'Storage system accessible and configured',
        details: { path: storagePath },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Storage check failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkInstallation(): Promise<HealthCheck> {
    try {
      const installFlagPath = path.join(process.cwd(), '.installed');
      const configPath = path.join(process.cwd(), '.env');

      const isInstalled = await fs.pathExists(installFlagPath);
      const hasConfig = await fs.pathExists(configPath);

      if (!isInstalled) {
        return {
          status: 'unhealthy',
          message: 'System not installed',
          details: { installed: false, hasConfig },
          timestamp: new Date().toISOString(),
        };
      }

      if (!hasConfig) {
        return {
          status: 'warning',
          message: 'Installation flag exists but configuration missing',
          details: { installed: true, hasConfig: false },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: 'System properly installed and configured',
        details: { installed: true, hasConfig: true },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Installation check failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkMetadata(): Promise<HealthCheck> {
    try {
      const metadataConfig = this.environmentService.getMetadataConfig();
      const enabledSources = Object.entries(metadataConfig)
        .filter(([, config]) => config.enabled)
        .map(([name]) => name);

      if (enabledSources.length === 0) {
        return {
          status: 'warning',
          message: 'No metadata sources configured',
          details: { enabledSources: [] },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: `Metadata sources configured: ${enabledSources.join(', ')}`,
        details: { enabledSources },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Metadata check failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    try {
      const storageConfig = this.environmentService.getStorageConfig();
      
      // Use fs.stat to get basic disk information
      const stats = await fs.stat(storageConfig.path);
      
      // For a more comprehensive disk check, we would need platform-specific tools
      // For now, just check if the directory is accessible
      return {
        status: 'healthy',
        message: 'Storage directory accessible',
        details: { 
          path: storageConfig.path,
          note: 'Detailed disk space monitoring requires platform-specific implementation'
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'warning',
        message: `Disk space check failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);

      const heapUsagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      if (heapUsagePercentage > 90) {
        return {
          status: 'warning',
          message: `High memory usage: ${heapUsagePercentage.toFixed(1)}%`,
          details: { heapUsedMB, heapTotalMB, rssMB, heapUsagePercentage },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        message: `Memory usage normal: ${heapUsedMB}MB used of ${heapTotalMB}MB`,
        details: { heapUsedMB, heapTotalMB, rssMB, heapUsagePercentage },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private determineOverallStatus(checks: Record<string, HealthCheck>): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.some(status => status === 'unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.some(status => status === 'warning')) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}
