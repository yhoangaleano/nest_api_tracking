// Framework imports
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Third-party libraries
import { Channel, ChannelModel, connect } from 'amqplib';

/**
 * Shared RabbitMQ connection service
 * Manages connection and channel creation for producers and consumers
 */
@Injectable()
export class RabbitMQConnectionService implements OnModuleDestroy {
  private connection: ChannelModel | null = null;
  private readonly channels: Channel[] = [];

  constructor(private readonly configService: ConfigService) {}

  /**
   * Establishes connection to RabbitMQ server
   * Reuses existing connection if already established
   * @returns Connected ChannelModel instance
   */
  async connect(): Promise<ChannelModel> {
    if (this.connection) {
      return this.connection;
    }

    const rabbitmqUrl =
      this.configService.get<string>('rabbitmq.url') || 'amqp://localhost:5672';

    this.connection = await connect(rabbitmqUrl);
    return this.connection;
  }

  /**
   * Creates a new channel for message publishing/consuming
   * Tracks channel for proper cleanup on module destroy
   * @returns Channel instance
   */
  async createChannel(): Promise<Channel> {
    const connection = await this.connect();
    const channel = await connection.createChannel();
    this.channels.push(channel);
    return channel;
  }

  /**
   * Ensures a queue exists, creates it if not
   * @param channel - Channel to use for queue assertion
   * @param queueName - Name of the queue
   * @param options - Queue options (durable, etc.)
   */
  async assertQueue(
    channel: Channel,
    queueName: string,
    options: { durable: boolean } = { durable: true },
  ): Promise<void> {
    await channel.assertQueue(queueName, options);
  }

  /**
   * Cleanup on module destroy
   * Closes all channels and connection properly
   */
  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.channels.map((channel) => channel.close()));
    await this.connection?.close();
  }
}
