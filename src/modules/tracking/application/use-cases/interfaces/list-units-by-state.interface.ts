// Application layer
import { UnitSummaryResponseOutput } from '../../dtos/output/unit-summary-response.output';

// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../../domain/configs';

export interface IListUnitsByStateUseCase {
  /**
   * Retrieves all units that match the specified state
   * @param state - The state to filter units by
   * @returns Promise with array of unit summaries
   */
  execute(state: UNIT_STATE_ENUMERATION): Promise<UnitSummaryResponseOutput[]>;
}

export const LIST_UNITS_BY_STATE_USE_CASE_TOKEN = 'IListUnitsByStateUseCase';
