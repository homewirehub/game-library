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
import { ItchService, ItchGame, DownloadProgress } from './itch.service';

interface SearchGamesRequest {
  query: string;
  limit?: number;
}

interface DownloadGameRequest {
  slug: string;
  gameTitle?: string;
}

@Controller('api/itch')
export class ItchController {
  private readonly logger = new Logger(ItchController.name);

  constructor(private readonly itchService: ItchService) {}

  @Get('status')
  async getStatus() {
    const isAvailable = await this.itchService.isAvailable();
    
    return {
      available: isAvailable,
      message: isAvailable 
        ? 'Itch.io CLI (Butler) is available' 
        : 'Itch.io CLI (Butler) not found. Install with: npm install -g @itchio/butler'
    };
  }

  @Post('search')
  async searchGames(@Body() request: SearchGamesRequest): Promise<ItchGame[]> {
    try {
      const { query, limit = 20 } = request;
      
      if (!query || query.trim().length === 0) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Searching for games: "${query}" (limit: ${limit})`);
      
      const games = await this.itchService.searchGames(query, limit);
      
      this.logger.log(`Found ${games.length} games for query: "${query}"`);
      
      return games;
    } catch (error) {
      this.logger.error('Failed to search games:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to search games',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('download')
  async downloadGame(@Body() request: DownloadGameRequest) {
    try {
      const { slug, gameTitle } = request;
      
      if (!slug || slug.trim().length === 0) {
        throw new HttpException('Game slug is required', HttpStatus.BAD_REQUEST);
      }

      const isAvailable = await this.itchService.isAvailable();
      if (!isAvailable) {
        throw new HttpException(
          'Itch.io CLI (Butler) not available. Please install it first.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      this.logger.log(`Starting download for game: ${slug}`);
      
      const gameId = await this.itchService.downloadGame(slug, gameTitle);
      
      return {
        gameId,
        message: `Download started for ${slug}`,
        status: 'started',
      };
    } catch (error) {
      this.logger.error('Failed to start download:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to start download',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('downloads')
  async getAllDownloads(): Promise<DownloadProgress[]> {
    try {
      return await this.itchService.getAllDownloads();
    } catch (error) {
      this.logger.error('Failed to get downloads:', error);
      throw new HttpException(
        'Failed to get download list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('downloads/:gameId')
  async getDownloadProgress(@Param('gameId') gameId: string): Promise<DownloadProgress> {
    try {
      const progress = await this.itchService.getDownloadProgress(gameId);
      
      if (!progress) {
        throw new HttpException(
          `Download not found for game: ${gameId}`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return progress;
    } catch (error) {
      this.logger.error(`Failed to get download progress for ${gameId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to get download progress',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('downloads/:gameId/cancel')
  async cancelDownload(@Param('gameId') gameId: string) {
    try {
      const cancelled = await this.itchService.cancelDownload(gameId);
      
      if (!cancelled) {
        throw new HttpException(
          `Cannot cancel download for game: ${gameId}. Download may not exist or already completed.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      this.logger.log(`Cancelled download for game: ${gameId}`);
      
      return {
        gameId,
        message: 'Download cancelled successfully',
        status: 'cancelled',
      };
    } catch (error) {
      this.logger.error(`Failed to cancel download for ${gameId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to cancel download',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('downloads/:gameId/retry')
  async retryDownload(@Param('gameId') gameId: string) {
    try {
      const retried = await this.itchService.retryDownload(gameId);
      
      if (!retried) {
        throw new HttpException(
          `Cannot retry download for game: ${gameId}. Download may not exist or not in failed state.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      this.logger.log(`Retrying download for game: ${gameId}`);
      
      return {
        gameId,
        message: 'Download retry started',
        status: 'retrying',
      };
    } catch (error) {
      this.logger.error(`Failed to retry download for ${gameId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to retry download',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('games/local')
  async getLocalGames(): Promise<ItchGame[]> {
    try {
      this.logger.log('Getting local games list');
      
      const games = await this.itchService.getLocalGames();
      
      this.logger.log(`Found ${games.length} local games`);
      
      return games;
    } catch (error) {
      this.logger.error('Failed to get local games:', error);
      throw new HttpException(
        'Failed to get local games list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('games/:gameId')
  async deleteGame(@Param('gameId') gameId: string) {
    try {
      const deleted = await this.itchService.deleteGame(gameId);
      
      if (!deleted) {
        throw new HttpException(
          `Failed to delete game: ${gameId}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      this.logger.log(`Deleted game: ${gameId}`);
      
      return {
        gameId,
        message: 'Game deleted successfully',
        status: 'deleted',
      };
    } catch (error) {
      this.logger.error(`Failed to delete game ${gameId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to delete game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cleanup')
  async cleanupDownloads() {
    try {
      await this.itchService.cleanup();
      
      this.logger.log('Cleanup completed successfully');
      
      return {
        message: 'Cleanup completed successfully',
        status: 'completed',
      };
    } catch (error) {
      this.logger.error('Failed to cleanup downloads:', error);
      throw new HttpException(
        'Failed to cleanup downloads',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Convenience endpoint for getting popular games
  @Get('featured')
  async getFeaturedGames(@Query('limit') limit?: string): Promise<ItchGame[]> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 20;
      
      // Search for popular/trending games
      const games = await this.itchService.searchGames('popular indie games', limitNum);
      
      return games;
    } catch (error) {
      this.logger.error('Failed to get featured games:', error);
      throw new HttpException(
        'Failed to get featured games',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Search by category/tag
  @Get('category/:category')
  async getGamesByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: string,
  ): Promise<ItchGame[]> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 20;
      
      if (!category || category.trim().length === 0) {
        throw new HttpException('Category is required', HttpStatus.BAD_REQUEST);
      }
      
      this.logger.log(`Getting games for category: ${category}`);
      
      const games = await this.itchService.searchGames(category, limitNum);
      
      return games;
    } catch (error) {
      this.logger.error(`Failed to get games for category ${category}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to get games by category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
