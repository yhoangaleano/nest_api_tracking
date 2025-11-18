import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsOrder } from 'typeorm';

import {
  Checkpoint,
  Unit,
  IUnitRepository,
  UnitAlreadyExistsError,
  UnitNotFoundError,
} from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';
import { UnitEntity, CheckpointEntity } from './entities';

const CHECKPOINT_ORDER: FindOptionsOrder<UnitEntity> = {
  checkpoints: { timestamp: 'ASC' },
};

@Injectable()
export class PostgresUnitRepository implements IUnitRepository {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    @InjectRepository(CheckpointEntity)
    private readonly checkpointRepository: Repository<CheckpointEntity>,
  ) {}

  async findByTrackingId(trackingId: string): Promise<Unit | null> {
    const entity = await this.unitRepository.findOne({
      where: { trackingId },
      relations: ['checkpoints'],
      order: CHECKPOINT_ORDER,
    });

    return entity ? this.toDomain(entity) : null;
  }

  async create(unit: Unit): Promise<Unit> {
    const existingEntity = await this.unitRepository.findOne({
      where: { trackingId: unit.trackingId },
    });

    if (existingEntity) {
      throw new UnitAlreadyExistsError(unit.trackingId);
    }

    const newEntity = this.unitRepository.create({
      trackingId: unit.trackingId,
      currentState: unit.currentState,
    });

    const checkpointEntities = unit.checkpoints.map((checkpoint) =>
      this.toCheckpointEntity(checkpoint),
    );

    newEntity.checkpoints = checkpointEntities;
    const savedEntity = await this.unitRepository.save(newEntity);

    return this.reloadAndConvert(savedEntity.id);
  }

  async update(unit: Unit): Promise<Unit> {
    const existingEntity = await this.unitRepository.findOne({
      where: { trackingId: unit.trackingId },
      relations: ['checkpoints'],
    });

    if (!existingEntity) {
      throw new UnitNotFoundError(unit.trackingId);
    }

    existingEntity.currentState = unit.currentState;

    const existingCheckpointKeys = new Set(
      existingEntity.checkpoints.map(
        (cp) => `${cp.status}-${cp.attemptNumber}`,
      ),
    );

    const newCheckpoints = unit.checkpoints.filter((domainCp) => {
      const key = `${domainCp.status}-${domainCp.attemptNumber}`;
      return !existingCheckpointKeys.has(key);
    });

    for (const checkpoint of newCheckpoints) {
      existingEntity.checkpoints.push(this.toCheckpointEntity(checkpoint));
    }

    const savedEntity = await this.unitRepository.save(existingEntity);

    return this.reloadAndConvert(savedEntity.id);
  }

  async findByState(state: UNIT_STATE_ENUMERATION): Promise<Unit[]> {
    const entities = await this.unitRepository.find({
      where: { currentState: state },
      relations: ['checkpoints'],
      order: CHECKPOINT_ORDER,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  private async reloadAndConvert(id: string): Promise<Unit> {
    const reloaded = await this.unitRepository.findOne({
      where: { id },
      relations: ['checkpoints'],
      order: CHECKPOINT_ORDER,
    });

    if (!reloaded) {
      throw new Error(`Failed to reload unit with id ${id}`);
    }

    return this.toDomain(reloaded);
  }

  private toCheckpointEntity(checkpoint: Checkpoint): CheckpointEntity {
    return this.checkpointRepository.create({
      status: checkpoint.status,
      attemptNumber: checkpoint.attemptNumber,
      location: checkpoint.location,
      timestamp: checkpoint.timestamp,
      notes: checkpoint.notes,
    });
  }

  private toDomain(entity: UnitEntity): Unit {
    const checkpoints = entity.checkpoints.map(
      (cp) =>
        new Checkpoint(
          cp.status,
          cp.location,
          cp.timestamp,
          cp.attemptNumber,
          cp.notes,
        ),
    );

    return new Unit(
      entity.id.toString(),
      entity.trackingId,
      entity.currentState,
      checkpoints,
    );
  }
}
