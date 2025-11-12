// Framework imports
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Third-party libraries
import { Channel, ConsumeMessage } from 'amqplib';

// Application layer
import { RegisterCheckpointDto } from '../../application/dtos/register-checkpoint.dto';
import { RegisterCheckpointUseCase } from '../../application/use-cases/register-checkpoint.use-case';

// Domain layer
import { InvalidStateTransitionError } from '../../domain/unit.errors';

// Own code imports
import {
  DEFAULT_RETRY_DELAY_MS_CONSTANT,
  MAX_RETRIES_CONSTANT,
  RETRY_DELAYS_MS_CONSTANT,
} from '../../configs/retry-strategy.constants';

// Infrastructure layer
import { RabbitMQConnectionService } from './rabbitmq-connection.service';

@Injectable()
export class CheckpointConsumer implements OnModuleInit {
  private channel!: Channel;
  private readonly queueName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMQConnection: RabbitMQConnectionService,
    private readonly registerCheckpointUseCase: RegisterCheckpointUseCase,
  ) {
    this.queueName =
      this.configService.get<string>('queue.checkpointQueueName') ||
      'checkpoint_events';
  }

  async onModuleInit(): Promise<void> {
    this.channel = await this.rabbitMQConnection.createChannel();

    await this.rabbitMQConnection.assertQueue(this.channel, this.queueName);

    const dlqName = `${this.queueName}_dlq`;
    await this.rabbitMQConnection.assertQueue(this.channel, dlqName);

    await this.channel.prefetch(1);

    await this.channel.consume(
      this.queueName,
      (msg) => {
        void this.handleMessage(msg);
      },
      { noAck: false },
    );

    console.log(`[Consumer] Listening on queue: ${this.queueName}`);
  }

  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg) {
      return;
    }

    try {
      const content = msg.content.toString();
      const checkpoint = JSON.parse(content) as RegisterCheckpointDto;

      console.log(
        `[Consumer] Processing checkpoint for: ${checkpoint.trackingId}`,
      );

      await this.registerCheckpointUseCase.execute(checkpoint);

      this.channel.ack(msg);
      console.log('[Consumer] Checkpoint processed successfully');
    } catch (error) {
      console.error('[Consumer] Error processing message:', error);

      const retryCount = this.getRetryCount(msg);

      if (
        error instanceof InvalidStateTransitionError &&
        retryCount < MAX_RETRIES_CONSTANT
      ) {
        const delay = this.calculateBackoffDelay(retryCount);
        console.log(
          `[Consumer] Invalid state transition, retry ${retryCount + 1}/${MAX_RETRIES_CONSTANT} (delay: ${delay}ms)`,
        );

        setTimeout(() => {
          this.requeueWithIncrementedRetry(msg);
        }, delay);
      } else {
        console.log(
          '[Consumer] Max retries exceeded or fatal error, sending to DLQ',
        );
        this.sendToDLQ(msg);
        this.channel.ack(msg);
      }
    }
  }

  private getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers || {};
    return (headers['x-retry-count'] as number) || 0;
  }

  private calculateBackoffDelay(retryCount: number): number {
    return (
      RETRY_DELAYS_MS_CONSTANT[retryCount] ||
      RETRY_DELAYS_MS_CONSTANT.at(-1) ||
      DEFAULT_RETRY_DELAY_MS_CONSTANT
    );
  }

  private requeueWithIncrementedRetry(msg: ConsumeMessage): void {
    const retryCount = this.getRetryCount(msg);

    this.channel.sendToQueue(this.queueName, msg.content, {
      persistent: true,
      headers: {
        ...msg.properties.headers,
        'x-retry-count': retryCount + 1,
      },
    });

    this.channel.ack(msg);
  }

  private sendToDLQ(msg: ConsumeMessage): void {
    const dlqName = `${this.queueName}_dlq`;
    const retryCount = this.getRetryCount(msg);

    this.channel.sendToQueue(dlqName, msg.content, {
      persistent: true,
      headers: {
        ...msg.properties.headers,
        'x-retry-count': retryCount + 1,
        'x-original-queue': this.queueName,
        'x-failed-at': new Date().toISOString(),
      },
    });
  }
}
