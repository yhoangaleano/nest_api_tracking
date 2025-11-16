// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../../domain/configs';

// Presentation layer
import { CheckpointResponseDto } from './checkpoint-response.dto';

export class UnitResponseDto {
  id!: string | null;
  trackingId!: string;
  currentState!: UNIT_STATE_ENUMERATION;
  checkpoints!: CheckpointResponseDto[];
}
