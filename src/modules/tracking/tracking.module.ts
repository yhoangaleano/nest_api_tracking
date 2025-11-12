// Framework imports
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Application layer
import { GetTrackingHistoryUseCase } from './application/use-cases/get-tracking-history.use-case';
import { ListUnitsByStateUseCase } from './application/use-cases/list-units-by-state.use-case';
import { RegisterCheckpointUseCase } from './application/use-cases/register-checkpoint.use-case';

// Domain layer
import { UNIT_REPOSITORY_TOKEN_CONSTANT } from './domain/unit.repository';

// Infrastructure layer
import { CheckpointConsumer } from './infrastructure/messaging/checkpoint.consumer';
import { CheckpointProducer } from './infrastructure/messaging/checkpoint.producer';
import { RabbitMQConnectionService } from './infrastructure/messaging/rabbitmq-connection.service';
import { MongoUnitRepository } from './infrastructure/persistence/mongo-unit.repository';
import {
  UnitDocument,
  UnitSchema,
} from './infrastructure/persistence/unit.schema';

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
    // Use Cases
    RegisterCheckpointUseCase,
    GetTrackingHistoryUseCase,
    ListUnitsByStateUseCase,

    // Repository (Dependency Injection)
    {
      provide: UNIT_REPOSITORY_TOKEN_CONSTANT,
      useClass: MongoUnitRepository,
    },

    // Messaging
    RabbitMQConnectionService,
    CheckpointProducer,
    CheckpointConsumer,
  ],
  exports: [CheckpointConsumer],
})
export class TrackingModule {}
