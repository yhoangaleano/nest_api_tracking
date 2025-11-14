import { Checkpoint } from './checkpoint.entity';
import { UnitState } from './unit-state.enum';
import { InvalidStateTransitionError } from './unit.errors';
import {
  INITIAL_CHECKPOINT_LOCATION_CONSTANT,
  INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
} from '../configs/domain-messages.constants';

export class Unit {
  constructor(
    public readonly id: string | null,
    public readonly trackingId: string,
    public currentState: UnitState,
    public checkpoints: Checkpoint[],
  ) {}

  static create(trackingId: string): Unit {
    const initialCheckpoint = Checkpoint.create(
      UnitState.CREATED,
      INITIAL_CHECKPOINT_LOCATION_CONSTANT,
      new Date(),
      INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
    );

    return new Unit(null, trackingId, UnitState.CREATED, [initialCheckpoint]);
  }

  addCheckpoint(checkpoint: Checkpoint): void {
    if (!this.isValidTransition(this.currentState, checkpoint.status)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        checkpoint.status,
      );
    }

    this.checkpoints.push(checkpoint);
    this.currentState = checkpoint.status;
  }

  private isValidTransition(from: UnitState, to: UnitState): boolean {
    const validTransitions: Record<UnitState, UnitState[]> = {
      [UnitState.CREATED]: [UnitState.PICKED_UP],
      [UnitState.PICKED_UP]: [UnitState.IN_TRANSIT],
      [UnitState.IN_TRANSIT]: [
        UnitState.OUT_FOR_DELIVERY,
        UnitState.FAILED_DELIVERY,
      ],
      [UnitState.OUT_FOR_DELIVERY]: [
        UnitState.DELIVERED,
        UnitState.FAILED_DELIVERY,
      ],
      [UnitState.DELIVERED]: [],
      [UnitState.FAILED_DELIVERY]: [UnitState.RETURNED, UnitState.IN_TRANSIT],
      [UnitState.RETURNED]: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}
