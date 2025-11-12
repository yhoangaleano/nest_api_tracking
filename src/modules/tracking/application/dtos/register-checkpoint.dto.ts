// Third-party libraries
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// Domain layer
import { UnitState } from '../../domain/unit-state.enum';

export class RegisterCheckpointDto {
  @IsNotEmpty()
  @IsString()
  trackingId!: string;

  @IsNotEmpty()
  @IsEnum(UnitState)
  status!: UnitState;

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
