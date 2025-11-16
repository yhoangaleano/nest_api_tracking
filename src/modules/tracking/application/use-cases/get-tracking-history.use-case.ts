// Domain layer
import {
  Unit,
  TrackingId,
  UnitNotFoundError,
  IUnitRepository,
  IGetTrackingHistoryUseCase,
} from '../../domain';

export class GetTrackingHistoryUseCase implements IGetTrackingHistoryUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(trackingId: TrackingId): Promise<Unit> {
    const unit = await this.unitRepository.findByTrackingId(trackingId.value);

    if (!unit) {
      throw new UnitNotFoundError(trackingId.value);
    }

    return unit;
  }
}
