// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../../domain/configs';

export class RegisterCheckpointInput {
  trackingId!: string;
  status!: UNIT_STATE_ENUMERATION;
  location!: string;
  timestamp!: string;
  notes?: string;
}
