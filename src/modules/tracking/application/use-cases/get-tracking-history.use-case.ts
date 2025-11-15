// Application layer
import { UnitResponseOutput } from '../dtos/output/unit-response.output';
import { IGetTrackingHistoryUseCase } from './interfaces/get-tracking-history.interface';

// Domain layer
import { UnitNotFoundError, IUnitRepository } from '../../domain';

export class GetTrackingHistoryUseCase implements IGetTrackingHistoryUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(trackingId: string): Promise<UnitResponseOutput> {
    const unit = await this.unitRepository.findByTrackingId(trackingId);

    if (!unit) {
      throw new UnitNotFoundError(trackingId);
    }

    return UnitResponseOutput.fromEntity(unit);
  }
}
