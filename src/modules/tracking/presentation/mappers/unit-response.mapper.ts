import { Unit } from '../../domain';

import { CheckpointResponseDto, UnitResponseDto } from '../dtos/output';

export class UnitResponseMapper {
  /**
   * Converts a Unit domain entity to UnitResponseDto for API responses
   * @param unit - Domain entity
   * @returns DTO for presentation layer
   */
  static toDto(unit: Unit): UnitResponseDto {
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

  /**
   * Converts an array of Unit entities to an array of UnitResponseDto
   * @param units - Array of domain entities
   * @returns Array of DTOs for presentation layer
   */
  static toDtoList(units: Unit[]): UnitResponseDto[] {
    return units.map((unit) => this.toDto(unit));
  }
}
