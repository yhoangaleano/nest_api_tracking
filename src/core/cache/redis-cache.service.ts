// Framework imports
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Third-party libraries
import Redis from 'ioredis';

// Core layer
import { ICacheService } from './cache.interface';

/**
 * Redis implementation of ICacheService
 * Handles cache operations using Redis
 */
@Injectable()
export class RedisCacheService implements ICacheService {
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password'),
      retryStrategy: () => null,
      lazyConnect: true,
    });
  }

  async clearAll(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    try {
      await this.ensureConnection();
      await this.redis.flushall();

      return {
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw new Error('Failed to clear cache');
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    uptime?: string;
    total_commands_processed?: string;
    total_connections_received?: string;
    used_memory?: string;
    used_memory_peak?: string;
    keyspace?: string;
    timestamp: string;
    error?: string;
  }> {
    try {
      await this.ensureConnection();

      const info = await this.redis.info('stats');
      const memory = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');

      return {
        connected: true,
        uptime: this.parseInfoValue(info, 'uptime_in_seconds'),
        total_commands_processed: this.parseInfoValue(
          info,
          'total_commands_processed',
        ),
        total_connections_received: this.parseInfoValue(
          info,
          'total_connections_received',
        ),
        used_memory: this.parseInfoValue(memory, 'used_memory_human'),
        used_memory_peak: this.parseInfoValue(memory, 'used_memory_peak_human'),
        keyspace: keyspace.includes('db0')
          ? keyspace.split('\n')[1] || 'No keys'
          : 'No keys',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        connected: false,
        error: 'Failed to retrieve cache statistics',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.ensureConnection();
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.redis.status || this.redis.status === 'end') {
      await this.redis.connect();
    }
  }

  private parseInfoValue(info: string, key: string): string {
    const line = info.split('\n').find((l) => l.startsWith(key));
    return line ? line.split(':')[1]?.trim() || 'N/A' : 'N/A';
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
