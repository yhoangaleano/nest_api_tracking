// Framework imports
import { ApiProperty } from '@nestjs/swagger';

// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../../domain/configs/unit-state.enum';

/**
 * Response DTO for unit creation
 * Used by POST /units endpoint (testing/development only)
 */
export class CreateUnitResponseDto {
  @ApiProperty({
    description: 'Tracking ID of the created unit',
    example: 'TRACK123',
  })
  trackingId!: string;

  @ApiProperty({
    description: 'Current state of the unit (always CREATED for new units)',
    example: UNIT_STATE_ENUMERATION.CREATED,
    enum: UNIT_STATE_ENUMERATION,
  })
  currentState!: UNIT_STATE_ENUMERATION;

  @ApiProperty({
    description: 'Timestamp when the unit was created',
    example: '2025-11-17T10:00:00Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Unit created successfully',
  })
  message!: string;
}
