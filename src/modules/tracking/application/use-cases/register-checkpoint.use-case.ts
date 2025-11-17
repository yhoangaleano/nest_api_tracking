import { Inject } from '@nestjs/common';

// Domain layer
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

/**
 * Use case for registering checkpoints on existing units
 * Uses cache to improve performance (via IUnitCachePort)
 * Validates state transitions using domain rules
 *
 * Clean Architecture:
 * - Depends on domain ports (IUnitRepository, IUnitCachePort)
 * - Does NOT depend on infrastructure implementations
 * - Infrastructure is injected via factory pattern (use-case.providers.ts)
 *
 * IMPORTANT: Units must exist before checkpoints can be added
 * This use case will NOT auto-create units
 */
export class RegisterCheckpointUseCase implements IRegisterCheckpointUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY_TOKEN_CONSTANT)
    private readonly unitRepository: IUnitRepository,
    @Inject(UNIT_CACHE_PORT_TOKEN)
    private readonly cachePort: IUnitCachePort,
  ) {}

  async execute(data: CheckpointData): Promise<void> {
    // Check cache first for unit existence
    const cachedExists = await this.cachePort.getUnitExists(data.trackingId);

    // Early return: if cache says unit doesn't exist
    if (cachedExists === '0') {
      throw new UnitNotFoundError(data.trackingId);
    }

    // Query database if not cached or cache says it exists
    const unit = await this.unitRepository.findByTrackingId(data.trackingId);

    // If unit not found, update cache and throw error
    if (!unit) {
      await this.cachePort.setUnitExists(data.trackingId, false);
      throw new UnitNotFoundError(data.trackingId);
    }

    // If we got here from cache miss, update cache with positive result
    if (cachedExists === null) {
      await this.cachePort.setUnitExists(data.trackingId, true);
    }

    // Validate state transition using pure function
    validateStateTransition(unit.currentState, data.status);

    // Calculate attempt number
    // If it's a retry of the same state, increment attempt_number
    // If it's a new state, start at attempt_number = 1
    const attemptNumber = this.calculateAttemptNumber(unit, data.status);

    // Create and add checkpoint
    const checkpoint = Checkpoint.create(
      data.status,
      data.location,
      data.timestamp,
      attemptNumber,
      data.notes,
    );

    unit.addCheckpoint(checkpoint);

    // Save unit with new checkpoint
    await this.unitRepository.save(unit);

    // Invalidate cache to ensure fresh data on next read
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
    // Find all checkpoints with the same status
    const checkpointsWithSameStatus = unit.checkpoints.filter(
      (cp) => cp.status === newStatus,
    );

    // If no previous checkpoints with this status, start at 1
    if (checkpointsWithSameStatus.length === 0) {
      return 1;
    }

    // Find the maximum attempt number for this status
    const maxAttempt = Math.max(
      ...checkpointsWithSameStatus.map((cp) => cp.attemptNumber),
    );

    // Increment for retry
    return maxAttempt + 1;
  }
}
