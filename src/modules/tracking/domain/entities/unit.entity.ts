import { Checkpoint } from './checkpoint.entity';
import { UNIT_STATE_ENUMERATION } from '../configs/unit-state.enum';
import { InvalidStateTransitionError } from '../exceptions/unit.errors';
import {
  INITIAL_CHECKPOINT_LOCATION_CONSTANT,
  INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
} from '../configs/unit.constants';
import { isValidTransition } from '../configs/state-transitions';

export class Unit {
  private _currentState: UNIT_STATE_ENUMERATION;
  private readonly _checkpoints: Checkpoint[];

  constructor(
    private readonly _id: string | null,
    private readonly _trackingId: string,
    currentState: UNIT_STATE_ENUMERATION,
    checkpoints: Checkpoint[],
  ) {
    this._currentState = currentState;
    this._checkpoints = [...checkpoints];
  }

  static create(trackingId: string): Unit {
    const initialCheckpoint = Checkpoint.create(
      UNIT_STATE_ENUMERATION.CREATED,
      INITIAL_CHECKPOINT_LOCATION_CONSTANT,
      new Date(),
      1,
      INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
    );

    return new Unit(null, trackingId, UNIT_STATE_ENUMERATION.CREATED, [
      initialCheckpoint,
    ]);
  }

  get id(): string | null {
    return this._id;
  }

  get trackingId(): string {
    return this._trackingId;
  }

  get currentState(): UNIT_STATE_ENUMERATION {
    return this._currentState;
  }

  get checkpoints(): Checkpoint[] {
    return [...this._checkpoints];
  }

  addCheckpoint(checkpoint: Checkpoint): void {
    if (!isValidTransition(this._currentState, checkpoint.status)) {
      throw new InvalidStateTransitionError(
        this._currentState,
        checkpoint.status,
      );
    }

    this._checkpoints.push(checkpoint);
    this._currentState = checkpoint.status;
  }

  getNextAttemptNumber(status: UNIT_STATE_ENUMERATION): number {
    const checkpointsWithSameStatus = this._checkpoints.filter(
      (cp) => cp.status === status,
    );

    if (checkpointsWithSameStatus.length === 0) {
      return 1;
    }

    const maxAttempt = Math.max(
      ...checkpointsWithSameStatus.map((cp) => cp.attemptNumber),
    );

    return maxAttempt + 1;
  }

  equals(other: Unit): boolean {
    if (!other) return false;
    return this._trackingId === other._trackingId;
  }
}
