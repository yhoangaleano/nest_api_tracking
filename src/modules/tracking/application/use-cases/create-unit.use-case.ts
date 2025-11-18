import {
  Unit,
  IUnitRepository,
  ICreateUnitUseCase,
  UnitAlreadyExistsError,
  TrackingId,
} from '../../domain';

export class CreateUnitUseCase implements ICreateUnitUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(trackingId: TrackingId): Promise<Unit> {
    const existingUnit = await this.unitRepository.findByTrackingId(
      trackingId.value,
    );
    if (existingUnit) {
      throw new UnitAlreadyExistsError(trackingId.value);
    }
    const unit = Unit.create(trackingId.value);
    const savedUnit = await this.unitRepository.save(unit);
    return savedUnit;
  }
}
