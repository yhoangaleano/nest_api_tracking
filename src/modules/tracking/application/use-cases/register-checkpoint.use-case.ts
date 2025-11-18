import { Inject } from '@nestjs/common';

import {
  CheckpointData,
  Checkpoint,
  Unit,
  IUnitRepository,
  IRegisterCheckpointUseCase,
  UNIT_REPOSITORY_TOKEN_CONSTANT,
  IUnitCachePort,
  UNIT_CACHE_PORT_TOKEN,
  UnitNotFoundError,
} from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs/unit-state.enum';
import { validateStateTransition } from '../../domain/configs/state-transitions';

export class RegisterCheckpointUseCase implements IRegisterCheckpointUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY_TOKEN_CONSTANT)
    private readonly unitRepository: IUnitRepository,
    @Inject(UNIT_CACHE_PORT_TOKEN)
    private readonly cachePort: IUnitCachePort,
  ) {}

  async execute(data: CheckpointData): Promise<void> {
    const cachedExists = await this.cachePort.getUnitExists(data.trackingId);
    if (cachedExists === '0') {
      throw new UnitNotFoundError(data.trackingId);
    }
    const unit = await this.unitRepository.findByTrackingId(data.trackingId);
    if (!unit) {
      await this.cachePort.setUnitExists(data.trackingId, false);
      throw new UnitNotFoundError(data.trackingId);
    }
    if (cachedExists === null) {
      await this.cachePort.setUnitExists(data.trackingId, true);
    }
    validateStateTransition(unit.currentState, data.status);
    const attemptNumber = this.calculateAttemptNumber(unit, data.status);
    const checkpoint = Checkpoint.create(
      data.status,
      data.location,
      data.timestamp,
      attemptNumber,
      data.notes,
    );
    unit.addCheckpoint(checkpoint);
    await this.unitRepository.save(unit);
    await this.cachePort.invalidateUnit(data.trackingId);
  }

  /**
   * Calculates the attempt number for a checkpoint
   * - If transitioning to a new state: attempt_number = 1
   * - If retrying the same state: attempt_number = last_attempt + 1
   */
  private calculateAttemptNumber(
    unit: Unit,
    newStatus: UNIT_STATE_ENUMERATION,
  ): number {
    const checkpointsWithSameStatus = unit.checkpoints.filter(
      (cp) => cp.status === newStatus,
    );
    if (checkpointsWithSameStatus.length === 0) {
      return 1;
    }
    const maxAttempt = Math.max(
      ...checkpointsWithSameStatus.map((cp) => cp.attemptNumber),
    );
    return maxAttempt + 1;
  }
}
