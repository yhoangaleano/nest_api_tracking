// Domain layer
import { UnitState } from '../../domain/unit-state.enum';
import { Unit } from '../../domain/unit.entity';

export class UnitSummaryResponseDto {
  id!: string | null;
  trackingId!: string;
  currentState!: UnitState;

  static fromEntity(unit: Unit): UnitSummaryResponseDto {
    const dto = new UnitSummaryResponseDto();
    dto.id = unit.id;
    dto.trackingId = unit.trackingId;
    dto.currentState = unit.currentState;
    return dto;
  }
}
