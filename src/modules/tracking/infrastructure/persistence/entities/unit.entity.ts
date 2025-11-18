import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { UNIT_STATE_ENUMERATION } from '../../../domain/configs/unit-state.enum';
import { CheckpointEntity } from './checkpoint.entity';

@Entity('units')
export class UnitEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'tracking_id' })
  @Index('idx_units_tracking_id')
  trackingId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'current_state',
    default: UNIT_STATE_ENUMERATION.CREATED,
  })
  @Index('idx_units_current_state')
  currentState!: UNIT_STATE_ENUMERATION;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => CheckpointEntity, (checkpoint) => checkpoint.unit, {
    cascade: true,
  })
  checkpoints!: CheckpointEntity[];
}
