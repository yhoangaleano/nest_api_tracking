// Framework imports
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new unit (testing/development only)
 *
 * In production, units are created by external systems (WMS, TMS, etc.)
 * This endpoint is only for testing and development purposes
 */
export class CreateUnitDto {
  @ApiProperty({
    description: 'Unique tracking ID for the unit',
    example: 'TRACK123',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  trackingId!: string;
}
