import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SteamService } from './steam.service';
import { SteamController } from './steam.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SteamController],
  providers: [SteamService],
  exports: [SteamService],
})
export class SteamModule {}
