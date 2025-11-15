// Framework imports
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Application layer
import { CHECKPOINT_PRODUCER_TOKEN } from './application/messaging/checkpoint-producer.interface';

// Domain layer
import { UNIT_REPOSITORY_TOKEN_CONSTANT } from './domain/repositories';

// Infrastructure layer
import { CheckpointConsumer } from './infrastructure/messaging/checkpoint.consumer';
import { CheckpointProducer } from './infrastructure/messaging/checkpoint.producer';
import { RabbitMQConnectionService } from './infrastructure/messaging/rabbitmq-connection.service';
import { MongoUnitRepository } from './infrastructure/persistence/mongo-unit.repository';
import {
  UnitDocument,
  UnitSchema,
} from './infrastructure/persistence/unit.schema';
import { USE_CASE_PROVIDERS } from './infrastructure/providers/use-case.providers';

// Presentation layer
import { TrackingController } from './presentation/tracking.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: UnitDocument.name, schema: UnitSchema },
    ]),
  ],
  controllers: [TrackingController],
  providers: [
    // Use Cases (Clean Architecture - Factory Pattern)
    ...USE_CASE_PROVIDERS,

    // Repository (Dependency Injection)
    {
      provide: UNIT_REPOSITORY_TOKEN_CONSTANT,
      useClass: MongoUnitRepository,
    },

    // Messaging (Dependency Injection)
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
