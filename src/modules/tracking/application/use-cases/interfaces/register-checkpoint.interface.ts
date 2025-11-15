// Application layer
import { RegisterCheckpointInput } from '../../dtos/input/register-checkpoint.input';

export interface IRegisterCheckpointUseCase {
  /**
   * Registers a new checkpoint, creating a new unit if necessary
   * @param input - The checkpoint data to register
   * @throws InvalidStateTransitionError when state transition is invalid
   */
  execute(input: RegisterCheckpointInput): Promise<void>;
}

export const REGISTER_CHECKPOINT_USE_CASE_TOKEN = 'IRegisterCheckpointUseCase';
