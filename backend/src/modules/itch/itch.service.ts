import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

export interface ItchGame {
  id: string;
  slug: string;
  title: string;
  author: string;
  url: string;
  cover_url?: string;
  description?: string;
  tags?: string[];
  platforms?: string[];
  price?: string;
  downloads_count?: number;
  published_at?: string;
}

export interface DownloadProgress {
  gameId: string;
  status: 'queued' | 'downloading' | 'extracting' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  error?: string;
  downloadPath?: string;
}

@Injectable()
export class ItchService {
  private readonly logger = new Logger(ItchService.name);
  private readonly downloadDir: string;
  private readonly installerDir: string;
  private readonly downloads = new Map<string, DownloadProgress>();

  constructor(private readonly configService: ConfigService) {
    this.downloadDir = this.configService.get<string>('DOWNLOAD_DIR', './storage/downloads');
    this.installerDir = this.configService.get<string>('INSTALLER_DIR', './storage/installers');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('butler --version');
      return true;
    } catch (error) {
      this.logger.warn('Butler (itch.io CLI) not found. Install with: npm install -g @itchio/butler');
      return false;
    }
  }

  async searchGames(query: string, limit: number = 20): Promise<ItchGame[]> {
    try {
      // Use itch.io API to search for games
      const response = await axios.get('https://itch.io/api/1/search/games', {
        params: {
          query,
          format: 'json',
          limit,
        },
        timeout: 10000,
      });

      return response.data.games.map((game: any) => ({
        id: game.id.toString(),
        slug: game.url.replace('https://itch.io/', ''),
        title: game.title,
        author: game.user?.username || 'Unknown',
        url: game.url,
        cover_url: game.cover_url,
        description: game.short_text,
        tags: game.tags || [],
        platforms: this.extractPlatforms(game),
        price: game.min_price ? `$${game.min_price}` : 'Free',
        downloads_count: game.downloads_count,
        published_at: game.published_at,
      }));
    } catch (error) {
      this.logger.error('Failed to search itch.io games:', error);
      return [];
    }
  }

  async downloadGame(slug: string, gameTitle?: string): Promise<string> {
    const gameId = this.slugToId(slug);
    
    if (this.downloads.has(gameId)) {
      throw new Error(`Download for ${slug} is already in progress`);
    }

    const progress: DownloadProgress = {
      gameId,
      status: 'queued',
      progress: 0,
      message: 'Download queued',
    };

    this.downloads.set(gameId, progress);
    this.logger.log(`Starting download for: ${slug}`);

    try {
      // Update status to downloading
      progress.status = 'downloading';
      progress.message = 'Downloading from itch.io';

      // Ensure download directory exists
      await fs.ensureDir(this.downloadDir);

      // Download using butler
      const downloadPath = path.join(this.downloadDir, `${gameId}`);
      await fs.ensureDir(downloadPath);

      const cmd = `butler download ${slug} --download-dir "${downloadPath}"`;
      this.logger.log(`Running: ${cmd}`);

      // Execute download with progress tracking
      await this.executeWithProgress(cmd, progress);

      // Update to extracting status
      progress.status = 'extracting';
      progress.progress = 90;
      progress.message = 'Extracting files';

      // Extract if it's a zip file
      await this.extractDownload(downloadPath, gameId);

      // Mark as completed
      progress.status = 'completed';
      progress.progress = 100;
      progress.message = 'Download completed successfully';
      progress.downloadPath = downloadPath;

      this.logger.log(`Download completed for: ${slug}`);
      return gameId;

    } catch (error) {
      progress.status = 'failed';
      progress.error = error.message;
      progress.message = `Download failed: ${error.message}`;
      
      this.logger.error(`Download failed for ${slug}:`, error);
      throw error;
    }
  }

  async getDownloadProgress(gameId: string): Promise<DownloadProgress | undefined> {
    return this.downloads.get(gameId);
  }

  async getAllDownloads(): Promise<DownloadProgress[]> {
    return Array.from(this.downloads.values());
  }

  async cancelDownload(gameId: string): Promise<boolean> {
    const progress = this.downloads.get(gameId);
    
    if (!progress || progress.status === 'completed' || progress.status === 'failed') {
      return false;
    }

    // TODO: Implement actual process cancellation
    progress.status = 'failed';
    progress.error = 'Cancelled by user';
    progress.message = 'Download cancelled';

    return true;
  }

  async retryDownload(gameId: string): Promise<boolean> {
    const progress = this.downloads.get(gameId);
    
    if (!progress || progress.status !== 'failed') {
      return false;
    }

    this.downloads.delete(gameId);
    // Extract slug from gameId (this is a simplified approach)
    const slug = this.idToSlug(gameId);
    
    try {
      await this.downloadGame(slug);
      return true;
    } catch (error) {
      this.logger.error(`Retry failed for ${gameId}:`, error);
      return false;
    }
  }

  async getLocalGames(): Promise<ItchGame[]> {
    try {
      const downloadedGames: ItchGame[] = [];
      
      if (!(await fs.pathExists(this.downloadDir))) {
        return downloadedGames;
      }

      const dirs = await fs.readdir(this.downloadDir);
      
      for (const dir of dirs) {
        const dirPath = path.join(this.downloadDir, dir);
        const stat = await fs.stat(dirPath);
        
        if (stat.isDirectory()) {
          // Look for metadata file or infer from directory structure
          const metadataPath = path.join(dirPath, 'metadata.json');
          let gameData: Partial<ItchGame> = {
            id: dir,
            slug: this.idToSlug(dir),
            title: dir.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
            author: 'Unknown',
            url: `https://itch.io/${this.idToSlug(dir)}`,
          };

          if (await fs.pathExists(metadataPath)) {
            try {
              const metadata = await fs.readJson(metadataPath);
              gameData = { ...gameData, ...metadata };
            } catch (error) {
              this.logger.warn(`Failed to read metadata for ${dir}:`, error);
            }
          }

          downloadedGames.push(gameData as ItchGame);
        }
      }

      return downloadedGames;
    } catch (error) {
      this.logger.error('Failed to get local games:', error);
      return [];
    }
  }

  async deleteGame(gameId: string): Promise<boolean> {
    try {
      const downloadPath = path.join(this.downloadDir, gameId);
      const installerPath = path.join(this.installerDir, gameId);

      // Remove from downloads tracking
      this.downloads.delete(gameId);

      // Remove files
      if (await fs.pathExists(downloadPath)) {
        await fs.remove(downloadPath);
      }

      if (await fs.pathExists(installerPath)) {
        await fs.remove(installerPath);
      }

      this.logger.log(`Deleted game: ${gameId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete game ${gameId}:`, error);
      return false;
    }
  }

  private async executeWithProgress(command: string, progress: DownloadProgress): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = exec(command);
      
      child.stdout?.on('data', (data: string) => {
        // Parse butler output for progress
        const progressMatch = data.match(/(\d+)%/);
        if (progressMatch) {
          progress.progress = Math.min(parseInt(progressMatch[1], 10), 89);
        }
        this.logger.debug(`Butler output: ${data.trim()}`);
      });

      child.stderr?.on('data', (data: string) => {
        this.logger.warn(`Butler stderr: ${data.trim()}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Butler exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async extractDownload(downloadPath: string, gameId: string): Promise<void> {
    try {
      const files = await fs.readdir(downloadPath);
      const zipFiles = files.filter(f => f.endsWith('.zip'));

      if (zipFiles.length === 0) {
        this.logger.log(`No zip files found in ${downloadPath}, assuming already extracted`);
        return;
      }

      const extractPath = path.join(this.installerDir, gameId);
      await fs.ensureDir(extractPath);

      for (const zipFile of zipFiles) {
        const zipPath = path.join(downloadPath, zipFile);
        this.logger.log(`Extracting ${zipFile} to ${extractPath}`);
        
        // Use a zip extraction library (you'll need to install one)
        // For now, this is a placeholder
        // await extract(zipPath, { dir: extractPath });
      }
    } catch (error) {
      this.logger.error(`Failed to extract download for ${gameId}:`, error);
      throw error;
    }
  }

  private extractPlatforms(game: any): string[] {
    const platforms: string[] = [];
    
    if (game.traits?.includes('windows')) platforms.push('windows');
    if (game.traits?.includes('mac')) platforms.push('mac');
    if (game.traits?.includes('linux')) platforms.push('linux');
    if (game.traits?.includes('web')) platforms.push('web');
    
    return platforms;
  }

  private slugToId(slug: string): string {
    return slug.replace(/[\/\\]/g, '-').toLowerCase();
  }

  private idToSlug(id: string): string {
    return id.replace(/-/g, '/');
  }

  // Cleanup old downloads
  async cleanup(): Promise<void> {
    const now = Date.now();
    const completedToRemove: string[] = [];

    this.downloads.forEach((progress, gameId) => {
      // Remove completed downloads older than 24 hours
      if (progress.status === 'completed' && (now - Date.now()) > 24 * 60 * 60 * 1000) {
        completedToRemove.push(gameId);
      }
    });

    completedToRemove.forEach(gameId => {
      this.downloads.delete(gameId);
    });

    if (completedToRemove.length > 0) {
      this.logger.log(`Cleaned up ${completedToRemove.length} old download records`);
    }
  }
}
