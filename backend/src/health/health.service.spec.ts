import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HealthService } from './health.service';
import { EnvironmentService } from '../config/environment.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [HealthService, EnvironmentService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should return a health structure', async () => {
    const result = await service.getHealth();
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('checks');
    expect(result).toHaveProperty('version');
  });
});
