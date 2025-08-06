import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ItchService } from './itch.service';
import { ItchController } from './itch.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ItchController],
  providers: [ItchService],
  exports: [ItchService],
})
export class ItchModule {}
