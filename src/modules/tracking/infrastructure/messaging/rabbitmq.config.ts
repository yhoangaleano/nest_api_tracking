/**
 * RabbitMQ configuration interface
 */
export interface RabbitMQConfigType {
  url: string;
  queueName: string;
}

/**
 * Dependency injection token for RabbitMQ configuration
 */
export const RABBITMQ_CONFIG_TOKEN_CONSTANT = 'RABBITMQ_CONFIG';
