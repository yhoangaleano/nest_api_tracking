// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';
import { Unit } from '../../domain/unit.entity';

export class UnitSummaryResponseDto {
  id!: string | null;
  trackingId!: string;
  currentState!: UNIT_STATE_ENUMERATION;

  static fromEntity(unit: Unit): UnitSummaryResponseDto {
    const dto = new UnitSummaryResponseDto();
    dto.id = unit.id;
    dto.trackingId = unit.trackingId;
    dto.currentState = unit.currentState;
    return dto;
  }
}
