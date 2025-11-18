import {
  Unit,
  UnitStateQuery,
  IUnitRepository,
  IListUnitsByStateUseCase,
} from '../../domain';

export class ListUnitsByStateUseCase implements IListUnitsByStateUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(stateQuery: UnitStateQuery): Promise<Unit[]> {
    const units = await this.unitRepository.findByState(stateQuery.state);
    return units;
  }
}
