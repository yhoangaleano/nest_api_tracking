import { CheckpointData } from '../../value-objects';

/**
 * Port for checkpoint message producer
 * Uses Value Object to ensure data integrity
 */
export interface ICheckpointProducer {
  /**
   * Publishes a checkpoint message to the queue
   * @param data - The checkpoint data (Value Object)
   */
  publish(data: CheckpointData): void;
}

export const CHECKPOINT_PRODUCER_TOKEN = 'ICheckpointProducer';
