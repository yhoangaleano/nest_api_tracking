// Framework imports
import { Inject, ConflictException } from '@nestjs/common';

// Domain layer
import {
  Unit,
  IUnitRepository,
  UNIT_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain';

/**
 * Use case interface for creating units
 */
export interface ICreateUnitUseCase {
  execute(trackingId: string): Promise<Unit>;
}

/**
 * Use case for creating new units (testing/development only)
 *
 * IMPORTANT: This use case is ONLY for testing and development
 * In production, units should be created by external systems (WMS, TMS, etc.)
 *
 * Clean Architecture:
 * - Depends on domain ports (IUnitRepository)
 * - Does NOT depend on infrastructure implementations
 * - Infrastructure is injected via factory pattern (use-case.providers.ts)
 *
 * Business Rules:
 * - trackingId must be unique
 * - Unit is created with initial state CREATED
 * - Initial checkpoint is automatically created
 */
export class CreateUnitUseCase implements ICreateUnitUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY_TOKEN_CONSTANT)
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(trackingId: string): Promise<Unit> {
    // 1. Check if unit already exists
    const existingUnit = await this.unitRepository.findByTrackingId(trackingId);

    if (existingUnit) {
      throw new ConflictException(
        `Unit with tracking ID ${trackingId} already exists`,
      );
    }

    // 2. Create unit with initial checkpoint (state = CREATED)
    // Unit.create() automatically creates the initial checkpoint
    const unit = Unit.create(trackingId);

    // 3. Save unit (transacción automática de TypeORM)
    const savedUnit = await this.unitRepository.save(unit);

    return savedUnit;
  }
}

// Token for dependency injection
export const CREATE_UNIT_USE_CASE_TOKEN = Symbol('CREATE_UNIT_USE_CASE');
