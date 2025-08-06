import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';

// Validate environment on module initialization
const validatedEnv = validateEnv();

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
  providers: [
    {
      provide: 'ENV_CONFIG',
      useValue: validatedEnv,
    },
  ],
  exports: ['ENV_CONFIG'],
})
export class ConfigModule {}
