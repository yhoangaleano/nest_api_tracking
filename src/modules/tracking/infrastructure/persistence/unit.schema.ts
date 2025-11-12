// Framework imports
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Third-party libraries
import { Document } from 'mongoose';

// Domain layer
import { UnitState } from '../../domain/unit-state.enum';

class CheckpointDocument {
  @Prop({ required: true, enum: UnitState })
  status!: UnitState;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ required: true })
  location!: string;

  @Prop()
  notes?: string;
}

@Schema({ collection: 'units', timestamps: true })
export class UnitDocument extends Document {
  @Prop({ required: true, unique: true })
  trackingId!: string;

  @Prop({ required: true, enum: UnitState })
  currentState!: UnitState;

  @Prop({ type: [CheckpointDocument], required: true })
  checkpoints!: CheckpointDocument[];
}

export const UnitSchema = SchemaFactory.createForClass(UnitDocument);

// Composite indexes for optimization
UnitSchema.index({ currentState: 1, updatedAt: -1 });
