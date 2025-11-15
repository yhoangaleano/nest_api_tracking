// Third-party libraries
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';

export class RegisterCheckpointDto {
  @IsNotEmpty()
  @IsString()
  trackingId!: string;

  @IsNotEmpty()
  @IsEnum(UNIT_STATE_ENUMERATION)
  status!: UNIT_STATE_ENUMERATION;

  @IsNotEmpty()
  @IsString()
  location!: string;

  @IsNotEmpty()
  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
