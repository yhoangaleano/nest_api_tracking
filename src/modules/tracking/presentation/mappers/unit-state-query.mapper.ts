// Domain layer
import { UnitStateQuery } from '../../domain';

// Presentation layer
import { ListUnitsQueryDto } from '../dtos/list-units-query.dto';

/**
 * Mapper for converting ListUnitsQueryDto to UnitStateQuery Value Object
 * Ensures query parameters are validated at domain level
 */
export class UnitStateQueryMapper {
  /**
   * Converts a ListUnitsQueryDto to UnitStateQuery Value Object
   * @param dto - Query DTO from presentation layer
   * @returns UnitStateQuery Value Object with domain validations
   * @throws Error if state is invalid
   */
  static toValueObject(dto: ListUnitsQueryDto): UnitStateQuery {
    return UnitStateQuery.create(dto.status);
  }
}
