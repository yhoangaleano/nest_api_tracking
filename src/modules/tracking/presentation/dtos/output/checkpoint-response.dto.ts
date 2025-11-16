// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../../domain/configs';

export class CheckpointResponseDto {
  status: UNIT_STATE_ENUMERATION;
  timestamp: string;
  location: string;
  notes?: string;

  constructor(
    status: UNIT_STATE_ENUMERATION,
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
