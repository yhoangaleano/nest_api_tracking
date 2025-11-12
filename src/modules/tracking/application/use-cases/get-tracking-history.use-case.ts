// Framework imports
import { Inject, Injectable } from '@nestjs/common';

// Domain layer
import { Unit } from '../../domain/unit.entity';
import { UnitNotFoundError } from '../../domain/unit.errors';
import {
  IUnitRepository,
  UNIT_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain/unit.repository';

@Injectable()
export class GetTrackingHistoryUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY_TOKEN_CONSTANT)
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(trackingId: string): Promise<Unit> {
    const unit = await this.unitRepository.findByTrackingId(trackingId);

    if (!unit) {
      throw new UnitNotFoundError(trackingId);
    }

    return unit;
  }
}
