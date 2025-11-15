// Domain layer
import { Unit } from '../../../domain';
import { UNIT_STATE_ENUMERATION } from '../../../domain/configs';

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
