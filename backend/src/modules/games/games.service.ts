import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../../entities/game.entity';
import { MetadataService } from '../metadata/metadata.service';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    private metadataService: MetadataService,
  ) {}

  async getAllGames(): Promise<Game[]> {
    return this.gameRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async getGameById(id: number): Promise<Game> {
    return this.gameRepository.findOne({ where: { id } });
  }

  async uploadGame(file: Express.Multer.File): Promise<Game> {
    const game = this.gameRepository.create({
      title: file.originalname,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      status: 'uploaded'
    });

    const savedGame = await this.gameRepository.save(game);
    
    // Process metadata in background
    this.metadataService.processGameFile(savedGame.id);
    
    return savedGame;
  }

  async updateGame(id: number, updateData: Partial<Game>): Promise<Game> {
    await this.gameRepository.update(id, updateData);
    return this.getGameById(id);
  }

  async deleteGame(id: number): Promise<void> {
    await this.gameRepository.delete(id);
  }

  async getGameFile(id: number): Promise<string> {
    const game = await this.getGameById(id);
    return game?.filePath;
  }
}
