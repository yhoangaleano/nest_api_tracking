import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from '../../domain/user.entity';
import { IUserRepository } from '../../domain/user.repository';

import { UserEntity } from './entities';

/**
 * PostgreSQL implementation of IUserRepository using TypeORM
 * Handles mapping between domain User entity and TypeORM UserEntity
 */
@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({
      where: { email },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({
      where: { id },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    if (user.id) {
      // Update existing user
      const existingEntity = await this.userRepository.findOne({
        where: { id: user.id },
      });

      if (existingEntity) {
        existingEntity.email = user.email;
        existingEntity.passwordHash = user.passwordHash;
        existingEntity.role = user.role;
        existingEntity.isActive = user.isActive;

        const savedEntity = await this.userRepository.save(existingEntity);
        return this.toDomain(savedEntity);
      }
    }

    // Create new user
    const newEntity = this.userRepository.create({
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
    });

    const savedEntity = await this.userRepository.save(newEntity);
    return this.toDomain(savedEntity);
  }

  /**
   * Maps TypeORM entity to domain entity
   */
  private toDomain(entity: UserEntity): User {
    return new User(
      entity.id,
      entity.email,
      entity.passwordHash,
      entity.role,
      entity.isActive,
      entity.createdAt,
    );
  }
}
