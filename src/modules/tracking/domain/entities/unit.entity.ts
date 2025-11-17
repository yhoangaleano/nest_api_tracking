import { Checkpoint } from './checkpoint.entity';
import { UNIT_STATE_ENUMERATION } from '../configs/unit-state.enum';
import { InvalidStateTransitionError } from '../exceptions/unit.errors';
import {
  INITIAL_CHECKPOINT_LOCATION_CONSTANT,
  INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
} from '../configs/unit.constants';
import { isValidTransition } from '../configs/state-transitions';

export class Unit {
  constructor(
    public readonly id: string | null,
    public readonly trackingId: string,
    public currentState: UNIT_STATE_ENUMERATION,
    public checkpoints: Checkpoint[],
  ) {}

  static create(trackingId: string): Unit {
    const initialCheckpoint = Checkpoint.create(
      UNIT_STATE_ENUMERATION.CREATED,
      INITIAL_CHECKPOINT_LOCATION_CONSTANT,
      new Date(),
      1, // attemptNumber - always 1 for initial checkpoint
      INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
    );

    return new Unit(null, trackingId, UNIT_STATE_ENUMERATION.CREATED, [
      initialCheckpoint,
    ]);
  }

  addCheckpoint(checkpoint: Checkpoint): void {
    if (!isValidTransition(this.currentState, checkpoint.status)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        checkpoint.status,
      );
    }

    this.checkpoints.push(checkpoint);
    this.currentState = checkpoint.status;
  }
}
