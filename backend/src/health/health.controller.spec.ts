import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService, SystemHealth } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealth: SystemHealth = {
    status: 'healthy',
    checks: {
      database: { status: 'healthy', message: 'ok', timestamp: new Date().toISOString() } as any,
      storage: { status: 'healthy', message: 'ok', timestamp: new Date().toISOString() } as any,
      installation: { status: 'healthy', message: 'ok', timestamp: new Date().toISOString() } as any,
      metadata: { status: 'healthy', message: 'ok', timestamp: new Date().toISOString() } as any,
      disk: { status: 'healthy', message: 'ok', timestamp: new Date().toISOString() } as any,
      memory: { status: 'healthy', message: 'ok', timestamp: new Date().toISOString() } as any,
    },
    version: 'test',
    uptime: 0,
    environment: 'test',
  } as any;

  const healthServiceMock = {
    getHealth: jest.fn(async () => mockHealth),
  } as Partial<HealthService> as HealthService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthService, useValue: healthServiceMock },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns health summary', async () => {
    const res = await controller.getHealth();
    expect(res).toEqual(mockHealth);
  });
});
