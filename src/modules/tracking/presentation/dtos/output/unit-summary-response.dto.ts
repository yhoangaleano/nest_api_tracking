// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../../domain/configs';

export class UnitSummaryResponseDto {
  id!: string | null;
  trackingId!: string;
  currentState!: UNIT_STATE_ENUMERATION;
}
