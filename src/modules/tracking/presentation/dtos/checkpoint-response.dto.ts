// Domain layer
import { UnitState } from '../../domain/unit-state.enum';

export class CheckpointResponseDto {
  status: UnitState;
  timestamp: string;
  location: string;
  notes?: string;

  constructor(
    status: UnitState,
    timestamp: Date,
    location: string,
    notes?: string,
  ) {
    this.status = status;
    this.timestamp = timestamp.toISOString();
    this.location = location;
    this.notes = notes;
  }
}
