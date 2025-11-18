import { UnitStateQuery } from '../../domain';

import { ListUnitsQueryDto } from '../dtos/list-units-query.dto';

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
