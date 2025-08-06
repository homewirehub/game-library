import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  Res,
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { GamesService } from './games.service';
import { Game } from '../../entities/game.entity';
import { FileUploadConfigService } from '../../common/file-upload.config';
import { VirusScanService } from '../../common/virus-scan.service';
import { UploadRateLimit } from '../../security/rate-limit.decorator';
import * as fs from 'fs-extra';

@Controller('games')
export class GamesController {
  private readonly logger = new Logger(GamesController.name);

  constructor(
    private readonly gamesService: GamesService,
    private readonly virusScanService: VirusScanService
  ) {}

  @Get()
  async getAllGames(): Promise<Game[]> {
    return this.gamesService.getAllGames();
  }

  @Get(':id')
  async getGame(@Param('id') id: number): Promise<Game> {
    return this.gamesService.getGameById(id);
  }

  @Post('upload')
  @UploadRateLimit() // Apply rate limiting to uploads
  @UseInterceptors(
    FileInterceptor('file', FileUploadConfigService.createMulterOptions())
  )
  async uploadGame(@UploadedFile() file: Express.Multer.File): Promise<Game> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Processing upload: ${file.originalname} (${file.size} bytes)`);

    try {
      // Perform virus scan if enabled
      const scanResult = await this.virusScanService.scanFile(file.path);
      
      if (!scanResult.isClean) {
        // Delete infected file immediately
        await fs.remove(file.path);
        
        this.logger.warn(`Infected file detected: ${file.originalname}`, {
          threats: scanResult.threats,
          scanner: scanResult.scanner
        });
        
        throw new BadRequestException(
          `File contains threats: ${scanResult.threats.join(', ')}`
        );
      }

      this.logger.log(`File scan completed: ${scanResult.scanner} (${scanResult.scanTime}ms)`);

      // Process the clean file
      return await this.gamesService.uploadGame(file);

    } catch (error) {
      // Cleanup file on error
      if (await fs.pathExists(file.path)) {
        await fs.remove(file.path);
      }
      
      this.logger.error(`Upload failed for ${file.originalname}:`, error);
      throw error;
    }
  }

  @Put(':id')
  async updateGame(@Param('id') id: number, @Body() updateData: Partial<Game>): Promise<Game> {
    return this.gamesService.updateGame(id, updateData);
  }

  @Delete(':id')
  async deleteGame(@Param('id') id: number): Promise<void> {
    return this.gamesService.deleteGame(id);
  }

  @Get(':id/download')
  async downloadGame(@Param('id') id: number, @Res() res: Response): Promise<void> {
    const filePath = await this.gamesService.getGameFile(id);
    res.download(filePath);
  }
}
