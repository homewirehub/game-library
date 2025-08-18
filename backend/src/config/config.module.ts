import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';
import { EnvironmentService } from './environment.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
      cache: true,
      expandVariables: true,
    }),
  ],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class ConfigModule {}
