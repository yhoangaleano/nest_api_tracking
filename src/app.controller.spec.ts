import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CACHE_SERVICE_TOKEN_CONSTANT } from './core/cache/cache.interface';
import { HEALTH_SERVICE_TOKEN_CONSTANT } from './core/health/health.interface';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: CACHE_SERVICE_TOKEN_CONSTANT,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
          },
        },
        {
          provide: HEALTH_SERVICE_TOKEN_CONSTANT,
          useValue: {
            checkHealth: jest.fn(),
            isHealthy: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return tracking API message', () => {
      expect(appController.getHello()).toBe(
        'Tracking API - PostgreSQL + Redis Migration Completed ✅',
      );
    });
  });
});
