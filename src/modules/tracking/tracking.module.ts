import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UNIT_REPOSITORY_TOKEN_CONSTANT } from './domain/repositories';
import { UNIT_CACHE_PORT_TOKEN } from './domain/ports/cache';

import {
  UnitEntity,
  CheckpointEntity,
} from './infrastructure/persistence/entities';
import { PostgresUnitRepository } from './infrastructure/persistence/postgres-unit.repository';

import { RedisUnitCacheAdapter } from './infrastructure/cache/redis-unit-cache.adapter';

import { USE_CASE_PROVIDERS } from './infrastructure/providers/use-case.providers';

import { TrackingController } from './presentation/tracking.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UnitEntity, CheckpointEntity]),
  ],
  controllers: [TrackingController],
  providers: [
    ...USE_CASE_PROVIDERS,
    {
      provide: UNIT_REPOSITORY_TOKEN_CONSTANT,
      useClass: PostgresUnitRepository,
    },
    {
      provide: UNIT_CACHE_PORT_TOKEN,
      useClass: RedisUnitCacheAdapter,
    },
  ],
})
export class TrackingModule {}
