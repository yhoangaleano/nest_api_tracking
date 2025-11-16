// Framework imports
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Third-party libraries
import { Channel } from 'amqplib';

// Application layer
import { ICheckpointProducer } from '../../application/messaging/checkpoint-producer.interface';

// Domain layer
import { CheckpointData } from '../../domain';

// Own code imports
import {
  CHECKPOINT_QUEUE_CONFIG_KEY_CONSTANT,
  DEFAULT_CHECKPOINT_QUEUE_NAME_CONSTANT,
} from '../../configs/messaging.constants';

// Infrastructure layer
import { RabbitMQConnectionService } from './rabbitmq-connection.service';

@Injectable()
export class CheckpointProducer implements OnModuleInit, ICheckpointProducer {
  private channel!: Channel;
  private readonly queueName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMQConnection: RabbitMQConnectionService,
  ) {
    this.queueName =
      this.configService.get<string>(CHECKPOINT_QUEUE_CONFIG_KEY_CONSTANT) ||
      DEFAULT_CHECKPOINT_QUEUE_NAME_CONSTANT;
  }

  async onModuleInit(): Promise<void> {
    this.channel = await this.rabbitMQConnection.createChannel();
    await this.rabbitMQConnection.assertQueue(this.channel, this.queueName);
  }

  publish(data: CheckpointData): void {
    // Convert Value Object to plain object for serialization
    const plainObject = data.toPlainObject();
    const message = JSON.stringify(plainObject);
    this.channel.sendToQueue(this.queueName, Buffer.from(message), {
      persistent: true,
    });
  }
}
