import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Game } from '../../entities/game.entity';
import { MetadataModule } from '../metadata/metadata.module';
import { VirusScanService } from '../../common/virus-scan.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    MetadataModule,
    ConfigModule
  ],
  controllers: [GamesController],
  providers: [GamesService, VirusScanService],
  exports: [GamesService]
})
export class GamesModule {}
