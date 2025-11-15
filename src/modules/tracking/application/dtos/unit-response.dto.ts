// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';
import { Unit } from '../../domain/unit.entity';

// Application layer
import { CheckpointResponseDto } from './checkpoint-response.dto';

export class UnitResponseDto {
  id!: string | null;
  trackingId!: string;
  currentState!: UNIT_STATE_ENUMERATION;
  checkpoints!: CheckpointResponseDto[];

  static fromEntity(unit: Unit): UnitResponseDto {
    const dto = new UnitResponseDto();
    dto.id = unit.id;
    dto.trackingId = unit.trackingId;
    dto.currentState = unit.currentState;
    dto.checkpoints = unit.checkpoints.map(
      (cp) =>
        new CheckpointResponseDto(
          cp.status,
          cp.timestamp,
          cp.location,
          cp.notes,
        ),
    );
    return dto;
  }
}
