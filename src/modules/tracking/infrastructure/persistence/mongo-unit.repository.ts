// Framework imports
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// Third-party libraries
import { Model } from 'mongoose';

// Domain layer
import { Checkpoint } from '../../domain/checkpoint.entity';
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';
import { Unit } from '../../domain/unit.entity';
import { IUnitRepository } from '../../domain/unit.repository';

// Infrastructure layer
import { UnitDocument } from './unit.schema';

@Injectable()
export class MongoUnitRepository implements IUnitRepository {
  constructor(
    @InjectModel(UnitDocument.name)
    private readonly unitModel: Model<UnitDocument>,
  ) {}

  async findByTrackingId(trackingId: string): Promise<Unit | null> {
    const doc = await this.unitModel.findOne({ trackingId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(unit: Unit): Promise<Unit> {
    const existingDoc = await this.unitModel
      .findOne({ trackingId: unit.trackingId })
      .exec();

    if (existingDoc) {
      existingDoc.currentState = unit.currentState;
      existingDoc.checkpoints = unit.checkpoints.map((cp) => ({
        status: cp.status,
        timestamp: cp.timestamp,
        location: cp.location,
        notes: cp.notes,
      }));
      const saved = await existingDoc.save();
      return this.toDomain(saved);
    } else {
      const newDoc = new this.unitModel({
        trackingId: unit.trackingId,
        currentState: unit.currentState,
        checkpoints: unit.checkpoints.map((cp) => ({
          status: cp.status,
          timestamp: cp.timestamp,
          location: cp.location,
          notes: cp.notes,
        })),
      });
      const saved = await newDoc.save();
      return this.toDomain(saved);
    }
  }

  async findByState(state: UNIT_STATE_ENUMERATION): Promise<Unit[]> {
    const docs = await this.unitModel.find({ currentState: state }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  private toDomain(doc: UnitDocument): Unit {
    const checkpoints = doc.checkpoints.map(
      (cp) => new Checkpoint(cp.status, cp.timestamp, cp.location, cp.notes),
    );
    return new Unit(
      doc._id?.toString() || null,
      doc.trackingId,
      doc.currentState,
      checkpoints,
    );
  }
}
