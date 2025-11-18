import { Unit } from '../../domain';

import { CreateUnitResponseDto } from '../dtos/output/create-unit-response.dto';

export class CreateUnitResponseMapper {
  static toDto(unit: Unit): CreateUnitResponseDto {
    const dto = new CreateUnitResponseDto();
    dto.trackingId = unit.trackingId;
    dto.currentState = unit.currentState;
    dto.createdAt =
      unit.checkpoints[0]?.timestamp.toISOString() ?? new Date().toISOString();
    dto.success = true;
    dto.message = 'Unit created successfully';
    return dto;
  }
}
