import { UNIT_STATE_ENUMERATION } from '../configs/unit-state.enum';

export class Checkpoint {
  constructor(
    public readonly status: UNIT_STATE_ENUMERATION,
    public readonly timestamp: Date,
    public readonly location: string,
    public readonly attemptNumber: number = 1,
    public readonly notes?: string,
  ) {}

  static create(
    status: UNIT_STATE_ENUMERATION,
    location: string,
    timestamp: Date,
    attemptNumber: number = 1,
    notes?: string,
  ): Checkpoint {
    return new Checkpoint(status, timestamp, location, attemptNumber, notes);
  }
}
