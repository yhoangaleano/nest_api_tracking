// Framework imports
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Third-party libraries
import { Channel, ConsumeMessage } from 'amqplib';

// Application layer
import { RegisterCheckpointUseCase } from '../../application/use-cases/register-checkpoint.use-case';

// Presentation layer
import { RegisterCheckpointDto } from '../../presentation/dtos/register-checkpoint.dto';

// Domain layer
import { InvalidStateTransitionError } from '../../domain/unit.errors';

// Own code imports
import {
  DEFAULT_RETRY_DELAY_MS_CONSTANT,
  MAX_RETRIES_CONSTANT,
  RETRY_DELAYS_MS_CONSTANT,
} from '../../configs/retry-strategy.constants';
import {
  CHECKPOINT_QUEUE_CONFIG_KEY_CONSTANT,
  DEFAULT_CHECKPOINT_QUEUE_NAME_CONSTANT,
  DEFAULT_CONSUMER_PREFETCH_COUNT_CONSTANT,
  DELAY_QUEUE_SUFFIX_CONSTANT,
  DLQ_SUFFIX_CONSTANT,
  RABBITMQ_HEADER_FAILED_AT_CONSTANT,
  RABBITMQ_HEADER_ORIGINAL_QUEUE_CONSTANT,
  RABBITMQ_HEADER_RETRY_COUNT_CONSTANT,
} from '../../configs/messaging.constants';

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
      this.configService.get<string>(CHECKPOINT_QUEUE_CONFIG_KEY_CONSTANT) ||
      DEFAULT_CHECKPOINT_QUEUE_NAME_CONSTANT;
  }

  async onModuleInit(): Promise<void> {
    this.channel = await this.rabbitMQConnection.createChannel();

    await this.rabbitMQConnection.assertQueue(this.channel, this.queueName);

    const dlqName = `${this.queueName}${DLQ_SUFFIX_CONSTANT}`;
    await this.rabbitMQConnection.assertQueue(this.channel, dlqName);

    const delayQueueName = `${this.queueName}${DELAY_QUEUE_SUFFIX_CONSTANT}`;
    await this.channel.assertQueue(delayQueueName, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: this.queueName,
    });

    const prefetchCount =
      Number(this.configService.get<number>('queue.prefetchCount')) ||
      DEFAULT_CONSUMER_PREFETCH_COUNT_CONSTANT;

    await this.channel.prefetch(Number(prefetchCount));

    await this.channel.consume(
      this.queueName,
      (msg) => {
        void this.handleMessage(msg);
      },
      { noAck: false },
    );

    console.log(
      `[Consumer] Listening on queue: ${this.queueName} (prefetch: ${prefetchCount})`,
    );
  }

  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg) {
      return;
    }

    try {
      const content = msg.content.toString();
      const checkpoint = JSON.parse(content) as RegisterCheckpointDto;

      await this.registerCheckpointUseCase.execute(checkpoint);
      this.channel.ack(msg);
    } catch (error) {
      console.error('[Consumer] Error processing message:', error);

      const retryCount = this.getRetryCount(msg);

      if (
        error instanceof InvalidStateTransitionError &&
        retryCount < MAX_RETRIES_CONSTANT
      ) {
        const delay = this.calculateBackoffDelay(retryCount);
        console.log(
          `[Consumer] Retry ${retryCount + 1}/${MAX_RETRIES_CONSTANT} with delay ${delay}ms`,
        );
        this.requeueWithIncrementedRetry(msg, delay);
      } else {
        this.sendToDLQ(msg);
        this.channel.ack(msg);
      }
    }
  }

  private getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers || {};
    return (headers[RABBITMQ_HEADER_RETRY_COUNT_CONSTANT] as number) || 0;
  }

  private calculateBackoffDelay(retryCount: number): number {
    return (
      RETRY_DELAYS_MS_CONSTANT[retryCount] ||
      RETRY_DELAYS_MS_CONSTANT.at(-1) ||
      DEFAULT_RETRY_DELAY_MS_CONSTANT
    );
  }

  private requeueWithIncrementedRetry(
    msg: ConsumeMessage,
    delayMs: number,
  ): void {
    const retryCount = this.getRetryCount(msg);
    const delayQueueName = `${this.queueName}${DELAY_QUEUE_SUFFIX_CONSTANT}`;

    this.channel.sendToQueue(delayQueueName, msg.content, {
      persistent: true,
      expiration: delayMs.toString(),
      headers: {
        ...msg.properties.headers,
        [RABBITMQ_HEADER_RETRY_COUNT_CONSTANT]: retryCount + 1,
      },
    });

    this.channel.ack(msg);
  }

  private sendToDLQ(msg: ConsumeMessage): void {
    const dlqName = `${this.queueName}${DLQ_SUFFIX_CONSTANT}`;
    const retryCount = this.getRetryCount(msg);

    this.channel.sendToQueue(dlqName, msg.content, {
      persistent: true,
      headers: {
        ...msg.properties.headers,
        [RABBITMQ_HEADER_RETRY_COUNT_CONSTANT]: retryCount + 1,
        [RABBITMQ_HEADER_ORIGINAL_QUEUE_CONSTANT]: this.queueName,
        [RABBITMQ_HEADER_FAILED_AT_CONSTANT]: new Date().toISOString(),
      },
    });
  }
}
