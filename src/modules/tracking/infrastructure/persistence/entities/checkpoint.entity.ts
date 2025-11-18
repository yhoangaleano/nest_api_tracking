import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';

import { UNIT_STATE_ENUMERATION } from '../../../domain/configs/unit-state.enum';
import { UnitEntity } from './unit.entity';

@Entity('checkpoints')
@Unique('uq_checkpoint_idempotency', ['unitId', 'status', 'attemptNumber'])
export class CheckpointEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'bigint', name: 'unit_id' })
  @Index('idx_checkpoints_unit_id')
  unitId!: string;

  @Column({ type: 'varchar', length: 50 })
  @Index('idx_checkpoints_status')
  status!: UNIT_STATE_ENUMERATION;

  @Column({
    type: 'smallint',
    name: 'attempt_number',
    default: 1,
  })
  attemptNumber!: number;

  @Column({ type: 'varchar', length: 200 })
  location!: string;

  @Column({ type: 'timestamptz' })
  @Index('idx_checkpoints_timestamp')
  timestamp!: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => UnitEntity, (unit) => unit.checkpoints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitEntity;
}
