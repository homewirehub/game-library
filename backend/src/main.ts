import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentService } from './config/environment.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Set consistent global API prefix
  app.setGlobalPrefix('api');
  
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
