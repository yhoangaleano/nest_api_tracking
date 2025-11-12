import { Unit } from './unit.entity';
import { UnitState } from './unit-state.enum';

export interface IUnitRepository {
  findByTrackingId(trackingId: string): Promise<Unit | null>;
  save(unit: Unit): Promise<Unit>;
  findByState(state: UnitState): Promise<Unit[]>;
}

export const UNIT_REPOSITORY_TOKEN_CONSTANT = 'IUnitRepository';
