// Domain layer
import { UnitState } from '../../domain/unit-state.enum';
import { Unit } from '../../domain/unit.entity';

// Presentation layer
import { CheckpointResponseDto } from './checkpoint-response.dto';

export class UnitResponseDto {
  id!: string | null;
  trackingId!: string;
  currentState!: UnitState;
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
