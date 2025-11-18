import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Checkpoint, Unit, IUnitRepository } from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

import { UnitEntity, CheckpointEntity } from './entities';

/**
 * PostgreSQL implementation of IUnitRepository using TypeORM
 * Handles mapping between domain entities and TypeORM entities
 */
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
      order: {
        checkpoints: {
          timestamp: 'ASC',
        },
      },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async save(unit: Unit): Promise<Unit> {
    const existingEntity = await this.unitRepository.findOne({
      where: { trackingId: unit.trackingId },
      relations: ['checkpoints'],
    });

    if (existingEntity) {
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
        const checkpointEntity = this.checkpointRepository.create({
          status: checkpoint.status,
          attemptNumber: checkpoint.attemptNumber,
          location: checkpoint.location,
          timestamp: checkpoint.timestamp,
          notes: checkpoint.notes,
        });
        existingEntity.checkpoints.push(checkpointEntity);
      }
      const savedEntity = await this.unitRepository.save(existingEntity);
      const reloaded = await this.unitRepository.findOne({
        where: { id: savedEntity.id },
        relations: ['checkpoints'],
        order: {
          checkpoints: {
            timestamp: 'ASC',
          },
        },
      });

      return this.toDomain(reloaded!);
    } else {
      const newEntity = this.unitRepository.create({
        trackingId: unit.trackingId,
        currentState: unit.currentState,
      });
      const checkpointEntities = unit.checkpoints.map((checkpoint) =>
        this.checkpointRepository.create({
          status: checkpoint.status,
          attemptNumber: checkpoint.attemptNumber,
          location: checkpoint.location,
          timestamp: checkpoint.timestamp,
          notes: checkpoint.notes,
        }),
      );

      newEntity.checkpoints = checkpointEntities;

      const savedUnit = await this.unitRepository.save(newEntity);

      const reloaded = await this.unitRepository.findOne({
        where: { id: savedUnit.id },
        relations: ['checkpoints'],
        order: {
          checkpoints: {
            timestamp: 'ASC',
          },
        },
      });

      return this.toDomain(reloaded!);
    }
  }

  async findByState(state: UNIT_STATE_ENUMERATION): Promise<Unit[]> {
    const entities = await this.unitRepository.find({
      where: { currentState: state },
      relations: ['checkpoints'],
      order: {
        checkpoints: {
          timestamp: 'ASC',
        },
      },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Maps TypeORM entity to domain entity
   */
  private toDomain(entity: UnitEntity): Unit {
    const checkpoints = entity.checkpoints.map(
      (cp) =>
        new Checkpoint(
          cp.status,
          cp.timestamp,
          cp.location,
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
