import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

export class RegisterCheckpointDto {
  @ApiProperty({
    description: 'Tracking ID of the unit',
    example: 'TRACK123',
  })
  @IsNotEmpty()
  @IsString()
  trackingId!: string;

  @ApiProperty({
    description: 'New status for the checkpoint',
    example: UNIT_STATE_ENUMERATION.PICKED_UP,
    enum: UNIT_STATE_ENUMERATION,
  })
  @IsNotEmpty()
  @IsEnum(UNIT_STATE_ENUMERATION)
  status!: UNIT_STATE_ENUMERATION;

  @ApiProperty({
    description: 'Location where the checkpoint occurred',
    example: 'Warehouse A',
  })
  @IsNotEmpty()
  @IsString()
  location!: string;

  @ApiProperty({
    description: 'Timestamp of the checkpoint in ISO 8601 format',
    example: '2025-11-17T10:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  timestamp!: string;

  @ApiProperty({
    description: 'Optional notes for the checkpoint',
    example: 'Package handled with care',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
