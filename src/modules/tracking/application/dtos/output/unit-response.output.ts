// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../../domain/unit-state.enumeration';
import { Unit } from '../../../domain/unit.entity';

// Application layer
import { CheckpointResponseOutput } from './checkpoint-response.output';

export class UnitResponseOutput {
  id!: string | null;
  trackingId!: string;
  currentState!: UNIT_STATE_ENUMERATION;
  checkpoints!: CheckpointResponseOutput[];

  static fromEntity(unit: Unit): UnitResponseOutput {
    const output = new UnitResponseOutput();
    output.id = unit.id;
    output.trackingId = unit.trackingId;
    output.currentState = unit.currentState;
    output.checkpoints = unit.checkpoints.map(
      (cp) =>
        new CheckpointResponseOutput(
          cp.status,
          cp.timestamp,
          cp.location,
          cp.notes,
        ),
    );
    return output;
  }
}
