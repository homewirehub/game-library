import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';

const execAsync = promisify(exec);

export interface ScanResult {
  isClean: boolean;
  threats: string[];
  scanTime: number;
  scanner: string;
}

@Injectable()
export class VirusScanService {
  private readonly logger = new Logger(VirusScanService.name);
  private readonly scanEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.scanEnabled = this.configService.get<boolean>('VIRUS_SCAN_ENABLED', false);
  }

  async scanFile(filePath: string): Promise<ScanResult> {
    const startTime = Date.now();

    if (!this.scanEnabled) {
      this.logger.debug('Virus scanning disabled, skipping scan');
      return {
        isClean: true,
        threats: [],
        scanTime: Date.now() - startTime,
        scanner: 'disabled'
      };
    }

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      // Try ClamAV first (most common)
      const clamAvResult = await this.scanWithClamAV(filePath);
      if (clamAvResult) {
        return {
          isClean: clamAvResult.isClean || false,
          threats: clamAvResult.threats || [],
          scanner: clamAvResult.scanner || 'clamav',
          scanTime: Date.now() - startTime
        };
      }

      // Try Windows Defender (if on Windows)
      if (process.platform === 'win32') {
        const defenderResult = await this.scanWithWindowsDefender(filePath);
        if (defenderResult) {
          return {
            isClean: defenderResult.isClean || false,
            threats: defenderResult.threats || [],
            scanner: defenderResult.scanner || 'windows-defender',
            scanTime: Date.now() - startTime
          };
        }
      }

      // If no scanner available, log warning and allow file
      this.logger.warn('No virus scanner available, allowing file');
      return {
        isClean: true,
        threats: [],
        scanTime: Date.now() - startTime,
        scanner: 'none'
      };

    } catch (error) {
      this.logger.error('Virus scan failed:', error);
      // In case of scan failure, you might want to reject the file
      // or allow it based on your security policy
      const rejectOnScanFailure = this.configService.get<boolean>('REJECT_ON_SCAN_FAILURE', true);
      
      if (rejectOnScanFailure) {
        throw new Error(`Virus scan failed: ${error.message}`);
      }

      return {
        isClean: true,
        threats: [],
        scanTime: Date.now() - startTime,
        scanner: 'failed'
      };
    }
  }

  private async scanWithClamAV(filePath: string): Promise<Partial<ScanResult> | null> {
    try {
      // Check if ClamAV is available
      await execAsync('clamscan --version');
      
      this.logger.debug(`Scanning file with ClamAV: ${filePath}`);
      const { stdout, stderr } = await execAsync(`clamscan --no-summary "${filePath}"`);
      
      // ClamAV returns 0 for clean files, 1 for infected files
      const isClean = !stdout.includes('FOUND');
      const threats: string[] = [];
      
      if (!isClean) {
        // Extract threat names from output
        const threatMatches = stdout.match(/: (.+) FOUND/g);
        if (threatMatches) {
          threats.push(...threatMatches.map(match => match.replace(/: (.+) FOUND/, '$1')));
        }
      }

      return {
        isClean,
        threats,
        scanner: 'clamav'
      };

    } catch (error) {
      if (error.message.includes('clamscan')) {
        this.logger.debug('ClamAV not available');
        return null;
      }
      throw error;
    }
  }

  private async scanWithWindowsDefender(filePath: string): Promise<Partial<ScanResult> | null> {
    try {
      this.logger.debug(`Scanning file with Windows Defender: ${filePath}`);
      
      const { stdout, stderr } = await execAsync(
        `powershell.exe -Command "Start-MpScan -ScanPath '${filePath}' -ScanType CustomScan"`
      );

      // Windows Defender doesn't return detailed threat info via this method
      // This is a basic implementation - you might want to use Windows Security APIs
      return {
        isClean: !stderr.includes('threat'),
        threats: stderr.includes('threat') ? ['Unknown threat detected'] : [],
        scanner: 'windows-defender'
      };

    } catch (error) {
      this.logger.debug('Windows Defender scan failed:', error.message);
      return null;
    }
  }

  async isAvailable(): Promise<{ available: boolean; scanners: string[] }> {
    const scanners: string[] = [];

    // Check ClamAV
    try {
      await execAsync('clamscan --version');
      scanners.push('clamav');
    } catch {
      // ClamAV not available
    }

    // Check Windows Defender
    if (process.platform === 'win32') {
      try {
        await execAsync('powershell.exe -Command "Get-MpComputerStatus"');
        scanners.push('windows-defender');
      } catch {
        // Windows Defender not available
      }
    }

    return {
      available: scanners.length > 0,
      scanners
    };
  }
}
