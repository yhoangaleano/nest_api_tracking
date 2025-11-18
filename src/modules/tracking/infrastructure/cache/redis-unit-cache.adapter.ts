import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

import { IUnitCachePort } from '../../domain/ports/cache';

@Injectable()
export class RedisUnitCacheAdapter
  implements IUnitCachePort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisUnitCacheAdapter.name);
  private client!: RedisClientType;
  private readonly ttl: number;
  private readonly keyPrefix = 'tracking:unit:';

  constructor(private readonly configService: ConfigService) {
    this.ttl = this.configService.get<number>('redis.ttl', 3600);
  }

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>('redis.url');

    this.client = createClient({ url });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    await this.client.connect();
  }

  async getUnitExists(trackingId: string): Promise<string | null> {
    try {
      const key = this.buildKey(trackingId);
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      this.logger.error(
        `Error getting cache for trackingId ${trackingId}`,
        error,
      );
      return null;
    }
  }

  async setUnitExists(trackingId: string, exists: boolean): Promise<void> {
    try {
      const key = this.buildKey(trackingId);
      const value = exists ? '1' : '0';
      await this.client.setEx(key, this.ttl, value);
    } catch (error) {
      this.logger.error(
        `Error setting cache for trackingId ${trackingId}`,
        error,
      );
    }
  }

  async invalidateUnit(trackingId: string): Promise<void> {
    try {
      const key = this.buildKey(trackingId);
      await this.client.del(key);
    } catch (error) {
      this.logger.error(
        `Error invalidating cache for trackingId ${trackingId}`,
        error,
      );
    }
  }

  async clearAll(): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.log(`Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      this.logger.error('Error clearing cache', error);
    }
  }

  private buildKey(trackingId: string): string {
    return `${this.keyPrefix}${trackingId}`;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis client disconnected');
    }
  }
}
