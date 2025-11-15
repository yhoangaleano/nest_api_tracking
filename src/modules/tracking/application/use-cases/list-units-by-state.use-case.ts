// Framework imports
import { Inject, Injectable } from '@nestjs/common';

// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';
import { Unit } from '../../domain/unit.entity';
import {
  IUnitRepository,
  UNIT_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain/unit.repository';

@Injectable()
export class ListUnitsByStateUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY_TOKEN_CONSTANT)
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(state: UNIT_STATE_ENUMERATION): Promise<Unit[]> {
    return this.unitRepository.findByState(state);
  }
}
