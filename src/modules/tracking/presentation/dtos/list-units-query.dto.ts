// Third-party libraries
import { IsEnum, IsNotEmpty } from 'class-validator';

// Domain layer
import { UnitState } from '../../domain/unit-state.enum';

export class ListUnitsQueryDto {
  @IsNotEmpty()
  @IsEnum(UnitState)
  status!: UnitState;
}
