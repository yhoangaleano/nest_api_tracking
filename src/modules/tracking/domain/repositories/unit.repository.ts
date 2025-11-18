import { Unit } from '../entities/unit.entity';
import { UNIT_STATE_ENUMERATION } from '../configs/unit-state.enum';

export interface IUnitRepository {
  findByTrackingId(trackingId: string): Promise<Unit | null>;
  findByState(state: UNIT_STATE_ENUMERATION): Promise<Unit[]>;
  create(unit: Unit): Promise<Unit>;
  update(unit: Unit): Promise<Unit>;
}

export const UNIT_REPOSITORY_TOKEN_CONSTANT = 'IUnitRepository';
