import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

import { USER_ROLE_ENUMERATION } from '../../domain/user-role.enum';

@Schema({ collection: 'users', timestamps: true })
export class UserDocument extends Document {
  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, enum: USER_ROLE_ENUMERATION })
  role!: USER_ROLE_ENUMERATION;

  @Prop({ required: true, default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

// Indexes for optimization
UserSchema.index({ isActive: 1 });
