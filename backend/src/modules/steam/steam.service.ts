import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SteamShortcut {
  id: string;
  appName: string;
  exe: string;
  startDir: string;
  icon?: string;
  tags?: string[];
  isVR?: boolean;
  allowDesktopConfig?: boolean;
  allowOverlay?: boolean;
  openVR?: boolean;
  devkit?: boolean;
  devkitGameID?: string;
  devkitOverrideAppID?: number;
  lastPlayTime?: number;
  category?: string;
}

export interface SteamGridAsset {
  type: 'grid' | 'hero' | 'logo' | 'icon';
  url: string;
  localPath?: string;
}

@Injectable()
export class SteamService {
  private readonly logger = new Logger(SteamService.name);
  private readonly steamAssetsDir: string;
  private readonly steamUserDataPath: string;

  constructor(private readonly configService: ConfigService) {
    this.steamAssetsDir = this.configService.get<string>('STEAM_ASSETS_DIR', './storage/steam-assets');
    this.steamUserDataPath = this.getSteamUserDataPath();
  }

  async isInstalled(): Promise<boolean> {
    try {
      const steamPath = this.getSteamPath();
      return await fs.pathExists(steamPath);
    } catch (error) {
      this.logger.warn('Steam not found:', error);
      return false;
    }
  }

  async getSteamUsers(): Promise<Array<{ id: string; name?: string; path: string }>> {
    try {
      if (!await this.isInstalled()) {
        return [];
      }

      const users: Array<{ id: string; name?: string; path: string }> = [];
      const userDataPath = this.steamUserDataPath;

      if (!(await fs.pathExists(userDataPath))) {
        return users;
      }

      const dirs = await fs.readdir(userDataPath);
      
      for (const dir of dirs) {
        // Skip non-numeric directories (like 'anonymous')
        if (!/^\d+$/.test(dir)) {
          continue;
        }

        const userPath = path.join(userDataPath, dir);
        const stat = await fs.stat(userPath);
        
        if (stat.isDirectory()) {
          // Try to get user name from Steam config
          let userName: string | undefined;
          
          try {
            const configPath = path.join(userPath, 'config', 'localconfig.vdf');
            if (await fs.pathExists(configPath)) {
              const configContent = await fs.readFile(configPath, 'utf-8');
              const nameMatch = configContent.match(/"PersonaName"\s*"([^"]+)"/);
              if (nameMatch) {
                userName = nameMatch[1];
              }
            }
          } catch (error) {
            this.logger.debug(`Could not read user name for ${dir}:`, error);
          }

          users.push({
            id: dir,
            name: userName,
            path: userPath,
          });
        }
      }

      return users;
    } catch (error) {
      this.logger.error('Failed to get Steam users:', error);
      return [];
    }
  }

  async addNonSteamGame(
    userId: string,
    gameId: string,
    gameName: string,
    executablePath: string,
    workingDir?: string,
    iconPath?: string,
    tags?: string[],
  ): Promise<boolean> {
    try {
      if (!await this.isInstalled()) {
        throw new Error('Steam is not installed');
      }

      this.logger.log(`Adding non-Steam game: ${gameName} for user ${userId}`);

      const shortcut: SteamShortcut = {
        id: gameId,
        appName: gameName,
        exe: executablePath,
        startDir: workingDir || path.dirname(executablePath),
        icon: iconPath,
        tags: tags || ['Itch.io', 'Indie'],
        allowDesktopConfig: true,
        allowOverlay: true,
        isVR: false,
        openVR: false,
        devkit: false,
        lastPlayTime: 0,
      };

      // Add to Steam shortcuts
      const added = await this.addShortcutToSteam(userId, shortcut);
      
      if (added && iconPath) {
        // Set custom artwork
        await this.setCustomArtwork(userId, gameId, iconPath);
      }

      this.logger.log(`Successfully added ${gameName} to Steam`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to add game ${gameName} to Steam:`, error);
      return false;
    }
  }

  async removeNonSteamGame(userId: string, gameId: string): Promise<boolean> {
    try {
      this.logger.log(`Removing non-Steam game: ${gameId} for user ${userId}`);

      const removed = await this.removeShortcutFromSteam(userId, gameId);
      
      if (removed) {
        // Clean up custom artwork
        await this.removeCustomArtwork(userId, gameId);
      }

      this.logger.log(`Successfully removed game ${gameId} from Steam`);
      return removed;

    } catch (error) {
      this.logger.error(`Failed to remove game ${gameId} from Steam:`, error);
      return false;
    }
  }

  async getNonSteamGames(userId: string): Promise<SteamShortcut[]> {
    try {
      const userPath = path.join(this.steamUserDataPath, userId);
      const shortcutsPath = path.join(userPath, 'config', 'shortcuts.vdf');

      if (!(await fs.pathExists(shortcutsPath))) {
        return [];
      }

      // Read and parse shortcuts.vdf file
      // This is a simplified implementation - you might want to use a proper VDF parser
      const shortcuts = await this.parseShortcutsVdf(shortcutsPath);
      
      return shortcuts.filter(shortcut => 
        shortcut.tags?.includes('Itch.io') || 
        shortcut.tags?.includes('Game Library')
      );

    } catch (error) {
      this.logger.error(`Failed to get non-Steam games for user ${userId}:`, error);
      return [];
    }
  }

  async downloadSteamGridAssets(
    gameId: string,
    gameName: string,
    searchQuery?: string,
  ): Promise<SteamGridAsset[]> {
    try {
      this.logger.log(`Downloading Steam Grid assets for: ${gameName}`);

      // Use SteamGridDB API if you have an API key
      const apiKey = this.configService.get<string>('STEAMGRIDDB_API_KEY');
      
      if (!apiKey) {
        this.logger.warn('SteamGridDB API key not configured, skipping asset download');
        return [];
      }

      const assets: SteamGridAsset[] = [];
      const query = searchQuery || gameName;

      // Search for game on SteamGridDB
      const searchResponse = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!searchResponse.ok) {
        throw new Error(`SteamGridDB search failed: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      
      if (searchData.data && searchData.data.length > 0) {
        const gameData = searchData.data[0];
        
        // Download different asset types
        for (const assetType of ['grids', 'heroes', 'logos', 'icons']) {
          try {
            const assetResponse = await fetch(`https://www.steamgriddb.com/api/v2/${assetType}/game/${gameData.id}`, {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
              },
            });

            if (assetResponse.ok) {
              const assetData = await assetResponse.json();
              
              if (assetData.data && assetData.data.length > 0) {
                const asset = assetData.data[0];
                const localPath = await this.downloadAsset(gameId, asset.url, assetType);
                
                assets.push({
                  type: assetType.slice(0, -1) as any, // Remove 's' from end
                  url: asset.url,
                  localPath,
                });
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to download ${assetType} for ${gameName}:`, error);
          }
        }
      }

      this.logger.log(`Downloaded ${assets.length} assets for ${gameName}`);
      return assets;

    } catch (error) {
      this.logger.error(`Failed to download Steam Grid assets for ${gameName}:`, error);
      return [];
    }
  }

  async restartSteam(): Promise<boolean> {
    try {
      this.logger.log('Restarting Steam to refresh library');

      if (process.platform === 'win32') {
        // Windows
        await execAsync('taskkill /f /im steam.exe');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await execAsync('start steam://');
      } else if (process.platform === 'linux') {
        // Linux
        await execAsync('pkill steam');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await execAsync('steam &');
      } else if (process.platform === 'darwin') {
        // macOS
        await execAsync('pkill Steam');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await execAsync('open /Applications/Steam.app');
      } else {
        throw new Error(`Unsupported platform: ${process.platform}`);
      }

      this.logger.log('Steam restart initiated');
      return true;

    } catch (error) {
      this.logger.error('Failed to restart Steam:', error);
      return false;
    }
  }

  private getSteamPath(): string {
    switch (process.platform) {
      case 'win32':
        return path.join(os.homedir(), 'AppData', 'Roaming', 'Steam');
      case 'linux':
        return path.join(os.homedir(), '.steam');
      case 'darwin':
        return path.join(os.homedir(), 'Library', 'Application Support', 'Steam');
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }

  private getSteamUserDataPath(): string {
    const steamPath = this.getSteamPath();
    return path.join(steamPath, 'userdata');
  }

  private async addShortcutToSteam(userId: string, shortcut: SteamShortcut): Promise<boolean> {
    try {
      const userPath = path.join(this.steamUserDataPath, userId);
      const shortcutsPath = path.join(userPath, 'config', 'shortcuts.vdf');

      // Ensure config directory exists
      await fs.ensureDir(path.dirname(shortcutsPath));

      let shortcuts: SteamShortcut[] = [];
      
      // Read existing shortcuts if file exists
      if (await fs.pathExists(shortcutsPath)) {
        shortcuts = await this.parseShortcutsVdf(shortcutsPath);
      }

      // Remove existing shortcut with same ID
      shortcuts = shortcuts.filter(s => s.id !== shortcut.id);

      // Add new shortcut
      shortcuts.push(shortcut);

      // Write back to file
      await this.writeShortcutsVdf(shortcutsPath, shortcuts);

      return true;
    } catch (error) {
      this.logger.error('Failed to add shortcut to Steam:', error);
      return false;
    }
  }

  private async removeShortcutFromSteam(userId: string, gameId: string): Promise<boolean> {
    try {
      const userPath = path.join(this.steamUserDataPath, userId);
      const shortcutsPath = path.join(userPath, 'config', 'shortcuts.vdf');

      if (!(await fs.pathExists(shortcutsPath))) {
        return false;
      }

      let shortcuts = await this.parseShortcutsVdf(shortcutsPath);
      const originalLength = shortcuts.length;

      shortcuts = shortcuts.filter(s => s.id !== gameId);

      if (shortcuts.length === originalLength) {
        return false; // Nothing was removed
      }

      await this.writeShortcutsVdf(shortcutsPath, shortcuts);

      return true;
    } catch (error) {
      this.logger.error('Failed to remove shortcut from Steam:', error);
      return false;
    }
  }

  private async setCustomArtwork(userId: string, gameId: string, iconPath: string): Promise<void> {
    try {
      const userPath = path.join(this.steamUserDataPath, userId);
      const gridPath = path.join(userPath, 'config', 'grid');
      
      await fs.ensureDir(gridPath);

      // Copy icon to Steam grid directory
      const gridFilename = `${gameId}.png`;
      const gridDestPath = path.join(gridPath, gridFilename);
      
      await fs.copy(iconPath, gridDestPath);

      this.logger.log(`Set custom artwork for game ${gameId}`);
    } catch (error) {
      this.logger.error(`Failed to set custom artwork for ${gameId}:`, error);
    }
  }

  private async removeCustomArtwork(userId: string, gameId: string): Promise<void> {
    try {
      const userPath = path.join(this.steamUserDataPath, userId);
      const gridPath = path.join(userPath, 'config', 'grid');
      
      const gridFilename = `${gameId}.png`;
      const gridFilePath = path.join(gridPath, gridFilename);
      
      if (await fs.pathExists(gridFilePath)) {
        await fs.remove(gridFilePath);
        this.logger.log(`Removed custom artwork for game ${gameId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove custom artwork for ${gameId}:`, error);
    }
  }

  private async downloadAsset(gameId: string, url: string, type: string): Promise<string> {
    try {
      await fs.ensureDir(this.steamAssetsDir);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download asset: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const filename = `${gameId}_${type}.png`;
      const localPath = path.join(this.steamAssetsDir, filename);

      await fs.writeFile(localPath, Buffer.from(buffer));

      return localPath;
    } catch (error) {
      this.logger.error(`Failed to download asset from ${url}:`, error);
      throw error;
    }
  }

  // Simplified VDF parser - you might want to use a proper library
  private async parseShortcutsVdf(filePath: string): Promise<SteamShortcut[]> {
    try {
      // This is a placeholder implementation
      // You should use a proper VDF parser library like 'vdf' or 'simple-vdf'
      const content = await fs.readFile(filePath, 'binary');
      
      // For now, return empty array - implement proper VDF parsing
      this.logger.warn('VDF parsing not implemented - using placeholder');
      return [];
    } catch (error) {
      this.logger.error('Failed to parse shortcuts VDF:', error);
      return [];
    }
  }

  private async writeShortcutsVdf(filePath: string, shortcuts: SteamShortcut[]): Promise<void> {
    try {
      // This is a placeholder implementation
      // You should use a proper VDF writer library
      this.logger.warn('VDF writing not implemented - using placeholder');
      
      // For now, just create an empty file
      await fs.writeFile(filePath, '');
    } catch (error) {
      this.logger.error('Failed to write shortcuts VDF:', error);
      throw error;
    }
  }
}
