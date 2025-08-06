import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  async getReadiness() {
    const health = await this.healthService.getHealth();
    if (health.status === 'unhealthy') {
      throw new Error('Service not ready');
    }
    return { status: 'ready' };
  }

  @Get('live')
  getLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}
