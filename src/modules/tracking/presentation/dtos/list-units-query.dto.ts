// Third-party libraries
import { IsEnum, IsNotEmpty } from 'class-validator';

// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

export class ListUnitsQueryDto {
  @IsNotEmpty()
  @IsEnum(UNIT_STATE_ENUMERATION)
  status!: UNIT_STATE_ENUMERATION;
}
