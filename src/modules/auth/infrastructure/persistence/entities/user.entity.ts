import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { USER_ROLE_ENUMERATION } from '../../../domain/user-role.enum';

/**
 * TypeORM entity for User table in PostgreSQL
 * Represents a user in the authentication system
 */
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email')
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: USER_ROLE_ENUMERATION.VIEWER,
  })
  role!: USER_ROLE_ENUMERATION;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
