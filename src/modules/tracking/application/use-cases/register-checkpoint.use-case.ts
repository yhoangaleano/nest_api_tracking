import {
  CheckpointData,
  Checkpoint,
  IUnitRepository,
  IRegisterCheckpointUseCase,
  IUnitCachePort,
  UnitNotFoundError,
} from '../../domain';

export class RegisterCheckpointUseCase implements IRegisterCheckpointUseCase {
  constructor(
    private readonly unitRepository: IUnitRepository,
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

    const attemptNumber = unit.getNextAttemptNumber(data.status);
    const checkpoint = Checkpoint.create(
      data.status,
      data.location,
      data.timestamp,
      attemptNumber,
      data.notes,
    );

    unit.addCheckpoint(checkpoint);
    await this.unitRepository.update(unit);
    await this.cachePort.invalidateUnit(data.trackingId);
  }
}
