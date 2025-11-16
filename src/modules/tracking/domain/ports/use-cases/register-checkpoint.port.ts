import { CheckpointData } from '../../value-objects';

/**
 * Port for registering a checkpoint
 * Uses Value Object for input validation
 */
export interface IRegisterCheckpointUseCase {
  /**
   * Registers a new checkpoint for a unit
   * @param data - Checkpoint data (validated Value Object)
   */
  execute(data: CheckpointData): Promise<void>;
}

export const REGISTER_CHECKPOINT_USE_CASE_TOKEN = 'IRegisterCheckpointUseCase';
