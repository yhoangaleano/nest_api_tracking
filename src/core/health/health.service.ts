// Framework imports
import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

// Third-party libraries
import { DataSource } from 'typeorm';

// Core layer
import {
  CACHE_SERVICE_TOKEN_CONSTANT,
  ICacheService,
} from '../cache/cache.interface';
import { IHealthService } from './health.interface';

/**
 * Health check service implementation
 * Handles health and readiness checks for critical services
 */
@Injectable()
export class HealthService implements IHealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(CACHE_SERVICE_TOKEN_CONSTANT)
    private readonly cacheService: ICacheService,
  ) {}

  async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
      return false;
    }
  }

  async getReadinessCheck(): Promise<{
    status: string;
    timestamp: string;
    checks: {
      postgres: boolean;
      redis: boolean;
    };
  }> {
    const checks = {
      postgres: await this.checkDatabase(),
      redis: await this.cacheService.isHealthy(),
    };

    const isReady = checks.postgres && checks.redis;

    return {
      status: isReady ? 'ready' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
