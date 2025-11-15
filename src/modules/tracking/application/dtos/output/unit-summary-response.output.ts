// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../../domain/unit-state.enumeration';
import { Unit } from '../../../domain/unit.entity';

export class UnitSummaryResponseOutput {
  id!: string | null;
  trackingId!: string;
  currentState!: UNIT_STATE_ENUMERATION;

  static fromEntity(unit: Unit): UnitSummaryResponseOutput {
    const output = new UnitSummaryResponseOutput();
    output.id = unit.id;
    output.trackingId = unit.trackingId;
    output.currentState = unit.currentState;
    return output;
  }
}
