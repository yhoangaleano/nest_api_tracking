import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Redis cache service for tracking module
 * Caches unit existence to reduce database queries
 *
 * Cache values:
 * - '1' = unit exists
 * - '0' = unit does not exist
 * - null = not cached (cache miss)
 */
@Injectable()
export class RedisCacheService implements OnModuleInit {
  private readonly logger = new Logger(RedisCacheService.name);
  private client!: RedisClientType;
  private readonly ttl: number;
  private readonly keyPrefix = 'tracking:unit:';

  constructor(private readonly configService: ConfigService) {
    this.ttl = this.configService.get<number>('redis.ttl', 3600);
  }

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    const password = this.configService.get<string>('redis.password');

    this.client = createClient({
      socket: {
        host,
        port,
      },
      password: password || undefined,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    await this.client.connect();
  }

  /**
   * Gets unit existence from cache
   * @param trackingId - The tracking ID of the unit
   * @returns '1' if exists, '0' if not exists, null if not cached
   */
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
      return null; // On error, treat as cache miss
    }
  }

  /**
   * Sets unit existence in cache
   * @param trackingId - The tracking ID of the unit
   * @param exists - true if unit exists, false if not
   */
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
      // Don't throw - cache failures should not break the application
    }
  }

  /**
   * Invalidates cache for a specific tracking ID
   * Used when a unit is created or updated
   * @param trackingId - The tracking ID of the unit
   */
  async invalidateUnit(trackingId: string): Promise<void> {
    try {
      const key = this.buildKey(trackingId);
      await this.client.del(key);
    } catch (error) {
      this.logger.error(
        `Error invalidating cache for trackingId ${trackingId}`,
        error,
      );
      // Don't throw - cache failures should not break the application
    }
  }

  /**
   * Clears all tracking cache
   * Use with caution - mainly for testing/maintenance
   */
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
      // Don't throw - cache failures should not break the application
    }
  }

  /**
   * Builds the cache key for a tracking ID
   * @param trackingId - The tracking ID
   * @returns The full cache key
   */
  private buildKey(trackingId: string): string {
    return `${this.keyPrefix}${trackingId}`;
  }

  /**
   * Closes the Redis connection
   * Called on application shutdown
   */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis client disconnected');
    }
  }
}
