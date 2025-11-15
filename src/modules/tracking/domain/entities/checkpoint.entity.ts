import { UNIT_STATE_ENUMERATION } from '../configs/unit-state.enum';

export class Checkpoint {
  constructor(
    public readonly status: UNIT_STATE_ENUMERATION,
    public readonly timestamp: Date,
    public readonly location: string,
    public readonly notes?: string,
  ) {}

  static create(
    status: UNIT_STATE_ENUMERATION,
    location: string,
    timestamp: Date,
    notes?: string,
  ): Checkpoint {
    return new Checkpoint(status, timestamp, location, notes);
  }
}
