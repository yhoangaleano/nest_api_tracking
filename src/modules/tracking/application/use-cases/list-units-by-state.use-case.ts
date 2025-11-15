// Application layer
import { UnitSummaryResponseOutput } from '../dtos/output/unit-summary-response.output';
import { IListUnitsByStateUseCase } from './interfaces/list-units-by-state.interface';

// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';
import { IUnitRepository } from '../../domain/unit.repository';

export class ListUnitsByStateUseCase implements IListUnitsByStateUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(
    state: UNIT_STATE_ENUMERATION,
  ): Promise<UnitSummaryResponseOutput[]> {
    const units = await this.unitRepository.findByState(state);
    return units.map((unit) => UnitSummaryResponseOutput.fromEntity(unit));
  }
}
