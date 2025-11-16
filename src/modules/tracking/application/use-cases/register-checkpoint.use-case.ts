// Domain layer
import {
  CheckpointData,
  Checkpoint,
  Unit,
  IUnitRepository,
  IRegisterCheckpointUseCase,
} from '../../domain';

export class RegisterCheckpointUseCase implements IRegisterCheckpointUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(data: CheckpointData): Promise<void> {
    let unit = await this.unitRepository.findByTrackingId(data.trackingId);

    unit ??= Unit.create(data.trackingId);

    const checkpoint = Checkpoint.create(
      data.status,
      data.location,
      data.timestamp,
      data.notes,
    );

    unit.addCheckpoint(checkpoint);

    await this.unitRepository.save(unit);
  }
}
