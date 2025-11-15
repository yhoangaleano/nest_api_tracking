import { Checkpoint } from './checkpoint.entity';
import { UNIT_STATE_ENUMERATION } from './unit-state.enumeration';
import { InvalidStateTransitionError } from './unit.errors';
import {
  INITIAL_CHECKPOINT_LOCATION_CONSTANT,
  INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
} from './unit.constants';

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
      INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
    );

    return new Unit(null, trackingId, UNIT_STATE_ENUMERATION.CREATED, [
      initialCheckpoint,
    ]);
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

  private isValidTransition(
    from: UNIT_STATE_ENUMERATION,
    to: UNIT_STATE_ENUMERATION,
  ): boolean {
    const validTransitions: Record<
      UNIT_STATE_ENUMERATION,
      UNIT_STATE_ENUMERATION[]
    > = {
      [UNIT_STATE_ENUMERATION.CREATED]: [UNIT_STATE_ENUMERATION.PICKED_UP],
      [UNIT_STATE_ENUMERATION.PICKED_UP]: [UNIT_STATE_ENUMERATION.IN_TRANSIT],
      [UNIT_STATE_ENUMERATION.IN_TRANSIT]: [
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
        UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
      ],
      [UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY]: [
        UNIT_STATE_ENUMERATION.DELIVERED,
        UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
      ],
      [UNIT_STATE_ENUMERATION.DELIVERED]: [],
      [UNIT_STATE_ENUMERATION.FAILED_DELIVERY]: [
        UNIT_STATE_ENUMERATION.RETURNED,
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
      ],
      [UNIT_STATE_ENUMERATION.RETURNED]: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}
