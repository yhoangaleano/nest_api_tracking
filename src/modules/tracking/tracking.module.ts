// Framework imports
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain layer
import { UNIT_REPOSITORY_TOKEN_CONSTANT } from './domain/repositories';
import { UNIT_CACHE_PORT_TOKEN } from './domain/ports/cache';

// Infrastructure layer - Persistence (PostgreSQL)
import {
  UnitEntity,
  CheckpointEntity,
} from './infrastructure/persistence/entities';
import { PostgresUnitRepository } from './infrastructure/persistence/postgres-unit.repository';

// Infrastructure layer - Cache
import { RedisUnitCacheAdapter } from './infrastructure/cache/redis-unit-cache.adapter';

// Infrastructure layer - Providers
import { USE_CASE_PROVIDERS } from './infrastructure/providers/use-case.providers';

// Presentation layer
import { TrackingController } from './presentation/tracking.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UnitEntity, CheckpointEntity]),
  ],
  controllers: [TrackingController],
  providers: [
    // Use Cases (Clean Architecture - Factory Pattern)
    ...USE_CASE_PROVIDERS,

    // Repository (Port/Adapter Pattern)
    // Domain defines the port (IUnitRepository)
    // Infrastructure provides the adapter (PostgresUnitRepository)
    {
      provide: UNIT_REPOSITORY_TOKEN_CONSTANT,
      useClass: PostgresUnitRepository,
    },

    // Cache (Port/Adapter Pattern)
    // Domain defines the port (IUnitCachePort)
    // Infrastructure provides the adapter (RedisUnitCacheAdapter)
    {
      provide: UNIT_CACHE_PORT_TOKEN,
      useClass: RedisUnitCacheAdapter,
    },
  ],
})
export class TrackingModule {}
