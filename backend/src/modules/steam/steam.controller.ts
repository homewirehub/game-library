import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { SteamService, SteamShortcut, SteamGridAsset } from './steam.service';

interface AddGameRequest {
  userId: string;
  gameId: string;
  gameName: string;
  executablePath: string;
  workingDir?: string;
  iconPath?: string;
  tags?: string[];
}

interface RemoveGameRequest {
  userId: string;
  gameId: string;
}

interface DownloadAssetsRequest {
  gameId: string;
  gameName: string;
  searchQuery?: string;
}

@Controller('api/steam')
export class SteamController {
  private readonly logger = new Logger(SteamController.name);

  constructor(private readonly steamService: SteamService) {}

  @Get('status')
  async getStatus() {
    const isInstalled = await this.steamService.isInstalled();
    
    return {
      installed: isInstalled,
      message: isInstalled 
        ? 'Steam is installed and accessible' 
        : 'Steam not found on this system'
    };
  }

  @Get('users')
  async getSteamUsers() {
    try {
      const users = await this.steamService.getSteamUsers();
      
      this.logger.log(`Found ${users.length} Steam users`);
      
      return {
        users,
        count: users.length,
      };
    } catch (error) {
      this.logger.error('Failed to get Steam users:', error);
      throw new HttpException(
        'Failed to get Steam users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('games/add')
  async addNonSteamGame(@Body() request: AddGameRequest) {
    try {
      const {
        userId,
        gameId,
        gameName,
        executablePath,
        workingDir,
        iconPath,
        tags,
      } = request;

      // Validate required fields
      if (!userId || !gameId || !gameName || !executablePath) {
        throw new HttpException(
          'userId, gameId, gameName, and executablePath are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const isInstalled = await this.steamService.isInstalled();
      if (!isInstalled) {
        throw new HttpException(
          'Steam is not installed on this system',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      this.logger.log(`Adding game "${gameName}" to Steam for user ${userId}`);

      const added = await this.steamService.addNonSteamGame(
        userId,
        gameId,
        gameName,
        executablePath,
        workingDir,
        iconPath,
        tags,
      );

      if (!added) {
        throw new HttpException(
          'Failed to add game to Steam',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        gameId,
        gameName,
        userId,
        message: 'Game added to Steam successfully',
        status: 'added',
      };
    } catch (error) {
      this.logger.error('Failed to add game to Steam:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to add game to Steam',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('games/remove')
  async removeNonSteamGame(@Body() request: RemoveGameRequest) {
    try {
      const { userId, gameId } = request;

      if (!userId || !gameId) {
        throw new HttpException(
          'userId and gameId are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Removing game ${gameId} from Steam for user ${userId}`);

      const removed = await this.steamService.removeNonSteamGame(userId, gameId);

      if (!removed) {
        throw new HttpException(
          'Game not found or failed to remove',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        gameId,
        userId,
        message: 'Game removed from Steam successfully',
        status: 'removed',
      };
    } catch (error) {
      this.logger.error('Failed to remove game from Steam:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to remove game from Steam',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('games/:userId')
  async getNonSteamGames(@Param('userId') userId: string): Promise<SteamShortcut[]> {
    try {
      if (!userId) {
        throw new HttpException(
          'userId is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Getting non-Steam games for user ${userId}`);

      const games = await this.steamService.getNonSteamGames(userId);

      this.logger.log(`Found ${games.length} non-Steam games for user ${userId}`);

      return games;
    } catch (error) {
      this.logger.error(`Failed to get games for user ${userId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to get non-Steam games',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('assets/download')
  async downloadSteamGridAssets(@Body() request: DownloadAssetsRequest): Promise<SteamGridAsset[]> {
    try {
      const { gameId, gameName, searchQuery } = request;

      if (!gameId || !gameName) {
        throw new HttpException(
          'gameId and gameName are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Downloading Steam Grid assets for: ${gameName}`);

      const assets = await this.steamService.downloadSteamGridAssets(
        gameId,
        gameName,
        searchQuery,
      );

      return assets;
    } catch (error) {
      this.logger.error('Failed to download Steam Grid assets:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to download Steam Grid assets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('restart')
  async restartSteam() {
    try {
      this.logger.log('Restarting Steam');

      const restarted = await this.steamService.restartSteam();

      if (!restarted) {
        throw new HttpException(
          'Failed to restart Steam',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        message: 'Steam restart initiated',
        status: 'restarting',
      };
    } catch (error) {
      this.logger.error('Failed to restart Steam:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to restart Steam',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Convenience endpoint for adding itch.io games to Steam
  @Post('games/add-itch')
  async addItchGameToSteam(@Body() request: {
    userId: string;
    gameId: string;
    gameName: string;
    gameSlug: string;
    executablePath?: string;
    downloadAssets?: boolean;
  }) {
    try {
      const {
        userId,
        gameId,
        gameName,
        gameSlug,
        executablePath,
        downloadAssets = true,
      } = request;

      if (!userId || !gameId || !gameName || !gameSlug) {
        throw new HttpException(
          'userId, gameId, gameName, and gameSlug are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Default executable path if not provided
      const exePath = executablePath || `itch://install/${gameSlug}`;

      this.logger.log(`Adding Itch.io game "${gameName}" to Steam`);

      // Add to Steam with Itch.io tags
      const added = await this.steamService.addNonSteamGame(
        userId,
        gameId,
        gameName,
        exePath,
        undefined, // working dir
        undefined, // icon path (will be downloaded)
        ['Itch.io', 'Indie Game', 'Game Library'],
      );

      if (!added) {
        throw new HttpException(
          'Failed to add Itch.io game to Steam',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      let assets: SteamGridAsset[] = [];

      // Download Steam Grid assets if requested
      if (downloadAssets) {
        try {
          assets = await this.steamService.downloadSteamGridAssets(
            gameId,
            gameName,
          );
        } catch (error) {
          this.logger.warn(`Failed to download assets for ${gameName}:`, error);
        }
      }

      return {
        gameId,
        gameName,
        userId,
        assets,
        message: 'Itch.io game added to Steam successfully',
        status: 'added',
      };
    } catch (error) {
      this.logger.error('Failed to add Itch.io game to Steam:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to add Itch.io game to Steam',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Bulk operations
  @Post('games/add-multiple')
  async addMultipleGames(@Body() request: {
    userId: string;
    games: Array<{
      gameId: string;
      gameName: string;
      executablePath: string;
      workingDir?: string;
      iconPath?: string;
      tags?: string[];
    }>;
  }) {
    try {
      const { userId, games } = request;

      if (!userId || !games || !Array.isArray(games)) {
        throw new HttpException(
          'userId and games array are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Adding ${games.length} games to Steam for user ${userId}`);

      const results = [];

      for (const game of games) {
        try {
          const added = await this.steamService.addNonSteamGame(
            userId,
            game.gameId,
            game.gameName,
            game.executablePath,
            game.workingDir,
            game.iconPath,
            game.tags,
          );

          results.push({
            gameId: game.gameId,
            gameName: game.gameName,
            success: added,
            error: added ? null : 'Failed to add game',
          });
        } catch (error) {
          results.push({
            gameId: game.gameId,
            gameName: game.gameName,
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      return {
        userId,
        totalGames: games.length,
        successCount,
        failureCount: games.length - successCount,
        results,
        message: `Added ${successCount}/${games.length} games to Steam`,
      };
    } catch (error) {
      this.logger.error('Failed to add multiple games to Steam:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to add multiple games to Steam',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
