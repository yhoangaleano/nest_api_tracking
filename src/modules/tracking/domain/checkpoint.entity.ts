import { UnitState } from './unit-state.enum';

export class Checkpoint {
  constructor(
    public readonly status: UnitState,
    public readonly timestamp: Date,
    public readonly location: string,
    public readonly notes?: string,
  ) {}

  static create(
    status: UnitState,
    location: string,
    timestamp: Date,
    notes?: string,
  ): Checkpoint {
    return new Checkpoint(status, timestamp, location, notes);
  }
}
