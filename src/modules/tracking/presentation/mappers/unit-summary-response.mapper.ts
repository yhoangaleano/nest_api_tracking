// Domain layer
import { Unit } from '../../domain';

// Presentation layer
import { UnitSummaryResponseDto } from '../dtos/output';

/**
 * Mapper for converting Unit entity to UnitSummaryResponseDto
 * Provides a lightweight summary without full checkpoint history
 */
export class UnitSummaryResponseMapper {
  /**
   * Converts a Unit domain entity to UnitSummaryResponseDto for API responses
   * @param unit - Domain entity
   * @returns Summary DTO for presentation layer
   */
  static toDto(unit: Unit): UnitSummaryResponseDto {
    const dto = new UnitSummaryResponseDto();
    dto.id = unit.id;
    dto.trackingId = unit.trackingId;
    dto.currentState = unit.currentState;
    return dto;
  }

  /**
   * Converts an array of Unit entities to an array of UnitSummaryResponseDto
   * @param units - Array of domain entities
   * @returns Array of summary DTOs for presentation layer
   */
  static toDtoList(units: Unit[]): UnitSummaryResponseDto[] {
    return units.map((unit) => this.toDto(unit));
  }
}
