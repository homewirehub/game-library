import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentService } from './config/environment.service';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Set consistent global API prefix
  app.setGlobalPrefix('api');

  // Global input validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Unified error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable CORS for frontend
  const envService = app.get(EnvironmentService);
  const corsOrigin = envService.getSecurityConfig().corsOrigin;
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Game Library Backend running on http://localhost:${port}`);
}
bootstrap();
