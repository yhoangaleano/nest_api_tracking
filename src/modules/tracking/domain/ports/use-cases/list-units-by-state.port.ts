import { Unit } from '../../entities';
import { UnitStateQuery } from '../../value-objects';

export interface IListUnitsByStateUseCase {
  /**
   * Retrieves all units that match the specified state
   * @param stateQuery - State query Value Object
   * @returns Array of Unit entities
   */
  execute(stateQuery: UnitStateQuery): Promise<Unit[]>;
}

export const LIST_UNITS_BY_STATE_USE_CASE_TOKEN = 'IListUnitsByStateUseCase';
