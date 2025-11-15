// Framework imports
import { Inject, Injectable } from '@nestjs/common';

// Presentation layer
import { RegisterCheckpointDto } from '../../presentation/dtos/register-checkpoint.dto';

// Domain layer
import { Checkpoint } from '../../domain/checkpoint.entity';
import { Unit } from '../../domain/unit.entity';
import {
  IUnitRepository,
  UNIT_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain/unit.repository';

@Injectable()
export class RegisterCheckpointUseCase {
  constructor(
    @Inject(UNIT_REPOSITORY_TOKEN_CONSTANT)
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(dto: RegisterCheckpointDto): Promise<void> {
    let unit = await this.unitRepository.findByTrackingId(dto.trackingId);

    unit ??= Unit.create(dto.trackingId);

    const checkpoint = Checkpoint.create(
      dto.status,
      dto.location,
      new Date(dto.timestamp),
      dto.notes,
    );

    unit.addCheckpoint(checkpoint);

    await this.unitRepository.save(unit);
  }
}
