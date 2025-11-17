// Domain layer
import {
  Unit,
  IUnitRepository,
  ICreateUnitUseCase,
  UnitAlreadyExistsError,
  TrackingId,
} from '../../domain';

/**
 * Use case for creating new units (testing/development only)
 *
 * IMPORTANT: This use case is ONLY for testing and development
 * In production, units should be created by external systems (WMS, TMS, etc.)
 *
 * Clean Architecture:
 * - Framework-agnostic (no NestJS dependencies)
 * - Depends on domain ports (IUnitRepository)
 * - Uses Value Objects for input validation
 * - Does NOT depend on infrastructure implementations
 * - Infrastructure is injected via factory pattern (use-case.providers.ts)
 *
 * Business Rules:
 * - trackingId must be unique and valid (enforced by TrackingId Value Object)
 * - Unit is created with initial state CREATED
 * - Initial checkpoint is automatically created
 */
export class CreateUnitUseCase implements ICreateUnitUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(trackingId: TrackingId): Promise<Unit> {
    // 1. Check if unit already exists
    const existingUnit = await this.unitRepository.findByTrackingId(
      trackingId.value,
    );

    if (existingUnit) {
      throw new UnitAlreadyExistsError(trackingId.value);
    }

    // 2. Create unit with initial checkpoint (state = CREATED)
    // Unit.create() automatically creates the initial checkpoint
    const unit = Unit.create(trackingId.value);

    // 3. Save unit (transacción automática de TypeORM)
    const savedUnit = await this.unitRepository.save(unit);

    return savedUnit;
  }
}
