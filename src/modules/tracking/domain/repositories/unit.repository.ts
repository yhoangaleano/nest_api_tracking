import { Unit } from '../entities/unit.entity';
import { UNIT_STATE_ENUMERATION } from '../configs/unit-state.enum';

export interface IUnitRepository {
  findByTrackingId(trackingId: string): Promise<Unit | null>;
  save(unit: Unit): Promise<Unit>;
  findByState(state: UNIT_STATE_ENUMERATION): Promise<Unit[]>;
}

export const UNIT_REPOSITORY_TOKEN_CONSTANT = 'IUnitRepository';
