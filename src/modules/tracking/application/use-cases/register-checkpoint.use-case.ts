// Application layer
import { RegisterCheckpointInput } from '../dtos/input/register-checkpoint.input';
import { IRegisterCheckpointUseCase } from './interfaces/register-checkpoint.interface';

// Domain layer
import { Checkpoint, Unit, IUnitRepository } from '../../domain';

export class RegisterCheckpointUseCase implements IRegisterCheckpointUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(input: RegisterCheckpointInput): Promise<void> {
    let unit = await this.unitRepository.findByTrackingId(input.trackingId);

    unit ??= Unit.create(input.trackingId);

    const checkpoint = Checkpoint.create(
      input.status,
      input.location,
      new Date(input.timestamp),
      input.notes,
    );

    unit.addCheckpoint(checkpoint);

    await this.unitRepository.save(unit);
  }
}
