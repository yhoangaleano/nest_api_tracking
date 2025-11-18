import {
  Unit,
  IUnitRepository,
  ICreateUnitUseCase,
  IUnitCachePort,
  TrackingId,
  UnitAlreadyExistsError,
} from '../../domain';

export class CreateUnitUseCase implements ICreateUnitUseCase {
  constructor(
    private readonly unitRepository: IUnitRepository,
    private readonly cachePort: IUnitCachePort,
  ) {}

  async execute(trackingId: TrackingId): Promise<Unit> {
    const cachedExists = await this.cachePort.getUnitExists(trackingId.value);

    if (cachedExists === '1') {
      throw new UnitAlreadyExistsError(trackingId.value);
    }

    const existingUnit = await this.unitRepository.findByTrackingId(
      trackingId.value,
    );

    if (existingUnit) {
      await this.cachePort.setUnitExists(trackingId.value, true);
      throw new UnitAlreadyExistsError(trackingId.value);
    }

    const unit = Unit.create(trackingId.value);
    const createdUnit = await this.unitRepository.create(unit);

    await this.cachePort.setUnitExists(trackingId.value, true);

    return createdUnit;
  }
}
