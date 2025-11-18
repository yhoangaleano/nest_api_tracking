import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { CACHE_SERVICE_TOKEN_CONSTANT, ICacheService } from './core/cache';
import { HEALTH_SERVICE_TOKEN_CONSTANT, IHealthService } from './core/health';

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_SERVICE_TOKEN_CONSTANT)
    private readonly cacheService: ICacheService,
    @Inject(HEALTH_SERVICE_TOKEN_CONSTANT)
    private readonly healthService: IHealthService,
  ) {}

  getHello(): string {
    return 'Tracking API - PostgreSQL + Redis';
  }

  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  async readinessCheck() {
    const result = await this.healthService.getReadinessCheck();

    if (result.status !== 'ready') {
      throw new ServiceUnavailableException({
        status: 'error',
        message: 'Service not ready',
        checks: result.checks,
      });
    }

    return result;
  }

  async clearCache() {
    return this.cacheService.clearAll();
  }

  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
