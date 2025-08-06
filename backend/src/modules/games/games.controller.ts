import { Controller, Get, Post, Put, Delete, Param, Body, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { GamesService } from './games.service';
import { Game } from '../../entities/game.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  async getAllGames(): Promise<Game[]> {
    return this.gamesService.getAllGames();
  }

  @Get(':id')
  async getGame(@Param('id') id: number): Promise<Game> {
    return this.gamesService.getGameById(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/games',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /\.(zip|rar|7z|iso|exe)$/i;
        if (allowedTypes.test(file.originalname)) {
          cb(null, true);
        } else {
          cb(new Error('Only game files (.zip, .rar, .7z, .iso, .exe) are allowed'), false);
        }
      },
    })
  )
  async uploadGame(@UploadedFile() file: Express.Multer.File): Promise<Game> {
    return this.gamesService.uploadGame(file);
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
