// Application layer
import { RegisterCheckpointInput } from '../dtos/input/register-checkpoint.input';

export interface ICheckpointProducer {
  /**
   * Publishes a checkpoint message to the queue
   * @param input - The checkpoint input data to publish (application layer)
   */
  publish(input: RegisterCheckpointInput): void;
}

export const CHECKPOINT_PRODUCER_TOKEN = 'ICheckpointProducer';
