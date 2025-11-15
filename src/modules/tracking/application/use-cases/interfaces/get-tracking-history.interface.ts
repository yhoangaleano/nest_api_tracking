// Application layer
import { UnitResponseOutput } from '../../dtos/output/unit-response.output';

export interface IGetTrackingHistoryUseCase {
  /**
   * Retrieves the complete tracking history for a given tracking ID
   * @param trackingId - The unique identifier for the unit
   * @returns Promise with the unit's complete tracking history
   * @throws UnitNotFoundError when tracking ID does not exist
   */
  execute(trackingId: string): Promise<UnitResponseOutput>;
}

export const GET_TRACKING_HISTORY_USE_CASE_TOKEN = 'IGetTrackingHistoryUseCase';
