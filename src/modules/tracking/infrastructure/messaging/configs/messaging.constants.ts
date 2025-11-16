import { QueueOptionsType } from '../types';

export const DEFAULT_CHECKPOINT_QUEUE_NAME_CONSTANT = 'checkpoint_events';
export const CHECKPOINT_QUEUE_CONFIG_KEY_CONSTANT = 'queue.checkpointQueueName';
export const DLQ_SUFFIX_CONSTANT = '_dlq';
export const DELAY_QUEUE_SUFFIX_CONSTANT = '_delay';

export const RABBITMQ_HEADER_RETRY_COUNT_CONSTANT = 'x-retry-count';
export const RABBITMQ_HEADER_ORIGINAL_QUEUE_CONSTANT = 'x-original-queue';
export const RABBITMQ_HEADER_FAILED_AT_CONSTANT = 'x-failed-at';

export const DEFAULT_CONSUMER_PREFETCH_COUNT_CONSTANT = 5;

export const DEFAULT_QUEUE_OPTIONS_CONSTANT: QueueOptionsType = {
  durable: true,
};
