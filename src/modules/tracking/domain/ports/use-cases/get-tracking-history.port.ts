import { Unit } from '../../entities';
import { TrackingId } from '../../value-objects';

/**
 * Port for retrieving tracking history
 * Returns domain entity (Unit)
 */
export interface IGetTrackingHistoryUseCase {
  /**
   * Retrieves the complete tracking history for a unit
   * @param trackingId - TrackingId Value Object
   * @returns Unit entity with full checkpoint history
   */
  execute(trackingId: TrackingId): Promise<Unit>;
}

export const GET_TRACKING_HISTORY_USE_CASE_TOKEN = 'IGetTrackingHistoryUseCase';
