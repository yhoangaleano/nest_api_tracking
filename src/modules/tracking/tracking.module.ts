// Framework imports
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain layer
import { UNIT_REPOSITORY_TOKEN_CONSTANT } from './domain/repositories';
import { CHECKPOINT_PRODUCER_TOKEN } from './domain/ports/messaging';
import { UNIT_CACHE_PORT_TOKEN } from './domain/ports/cache';
import { StateTransitionValidatorService } from './domain/services/state-transition-validator.service';

// Infrastructure layer - Messaging
import { CheckpointConsumer } from './infrastructure/messaging/checkpoint.consumer';
import { CheckpointProducer } from './infrastructure/messaging/checkpoint.producer';
import { RabbitMQConnectionService } from './infrastructure/messaging/rabbitmq-connection.service';

// Infrastructure layer - Persistence (MongoDB - temporal)
// import { MongoUnitRepository } from './infrastructure/persistence/mongo-unit.repository';
import {
  UnitDocument,
  UnitSchema,
} from './infrastructure/persistence/unit.schema';

// Infrastructure layer - Persistence (PostgreSQL - nuevo)
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

    // MongoDB (temporal - migración en progreso)
    MongooseModule.forFeature([
      { name: UnitDocument.name, schema: UnitSchema },
    ]),

    // PostgreSQL (nuevo)
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

    // Domain Services
    StateTransitionValidatorService,

    // Messaging (Dependency Injection - temporal, se eliminará en Fase 3 final)
    {
      provide: CHECKPOINT_PRODUCER_TOKEN,
      useClass: CheckpointProducer,
    },
    RabbitMQConnectionService,
    CheckpointConsumer,
  ],
  exports: [CheckpointConsumer],
})
export class TrackingModule {}
