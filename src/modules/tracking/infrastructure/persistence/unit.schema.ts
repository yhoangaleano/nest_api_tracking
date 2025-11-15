// Framework imports
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Third-party libraries
import { Document } from 'mongoose';

// Domain layer
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';

// Own code imports
import { UNITS_COLLECTION_NAME_CONSTANT } from '../../configs/persistence.constants';

class CheckpointDocument {
  @Prop({ required: true, enum: UNIT_STATE_ENUMERATION })
  status!: UNIT_STATE_ENUMERATION;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ required: true })
  location!: string;

  @Prop()
  notes?: string;
}

@Schema({ collection: UNITS_COLLECTION_NAME_CONSTANT, timestamps: true })
export class UnitDocument extends Document {
  @Prop({ required: true, unique: true })
  trackingId!: string;

  @Prop({ required: true, enum: UNIT_STATE_ENUMERATION })
  currentState!: UNIT_STATE_ENUMERATION;

  @Prop({ type: [CheckpointDocument], required: true })
  checkpoints!: CheckpointDocument[];
}

export const UnitSchema = SchemaFactory.createForClass(UnitDocument);

// Composite indexes for optimization
UnitSchema.index({ currentState: 1, updatedAt: -1 });
