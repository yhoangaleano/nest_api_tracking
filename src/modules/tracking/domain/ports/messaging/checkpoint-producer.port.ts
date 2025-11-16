// Domain layer
import { CheckpointData } from '../../value-objects/checkpoint-data.value-object';

/**
 * Output Port for publishing checkpoint messages
 * Infrastructure layer implements this interface
 */
export interface ICheckpointProducer {
  /**
   * Publishes a checkpoint message to the queue
   * @param data - The checkpoint data Value Object to publish
   */
  publish(data: CheckpointData): void;
}

export const CHECKPOINT_PRODUCER_TOKEN = 'ICheckpointProducer';
