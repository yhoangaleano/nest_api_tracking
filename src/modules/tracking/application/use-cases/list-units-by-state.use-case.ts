// Framework imports
import { Inject, Injectable } from '@nestjs/common';

// Application layer
import { UnitSummaryResponseDto } from '../dtos/unit-summary-response.dto';

// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';
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

  async execute(
    state: UNIT_STATE_ENUMERATION,
  ): Promise<UnitSummaryResponseDto[]> {
    const units = await this.unitRepository.findByState(state);
    return units.map((unit) => UnitSummaryResponseDto.fromEntity(unit));
  }
}
