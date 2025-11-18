import { Unit } from '../../entities';
import { TrackingId } from '../../value-objects';

export interface ICreateUnitUseCase {
  /**
   * Creates a new unit with initial state
   * @param trackingId - TrackingId Value Object (validated)
   * @returns Created unit
   * @throws UnitAlreadyExistsError if unit with trackingId already exists
   */
  execute(trackingId: TrackingId): Promise<Unit>;
}

export const CREATE_UNIT_USE_CASE_TOKEN = 'ICreateUnitUseCase';
