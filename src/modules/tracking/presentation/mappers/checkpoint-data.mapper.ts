import { CheckpointData } from '../../domain';

import { RegisterCheckpointDto } from '../dtos/register-checkpoint.dto';

export class CheckpointDataMapper {
  /**
   * Converts a RegisterCheckpointDto to CheckpointData Value Object
   * @param dto - DTO from presentation layer
   * @returns CheckpointData Value Object with domain validations
   * @throws InvalidValueObjectError if data is invalid
   */
  static toValueObject(dto: RegisterCheckpointDto): CheckpointData {
    return CheckpointData.create(
      dto.trackingId,
      dto.status,
      dto.location,
      dto.timestamp,
      dto.notes,
    );
  }
}
