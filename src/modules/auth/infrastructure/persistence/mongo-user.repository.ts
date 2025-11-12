import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { IUserRepository } from '../../domain/user.repository';
import { User } from '../../domain/user.entity';

import { UserDocument } from './user.schema';

@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ email }).exec();
    return userDoc ? this.toDomain(userDoc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const userDoc = await this.userModel.findById(id).exec();
    return userDoc ? this.toDomain(userDoc) : null;
  }

  async save(user: User): Promise<User> {
    if (user.id) {
      const userDoc = await this.userModel
        .findByIdAndUpdate(
          user.id,
          {
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role,
            isActive: user.isActive,
          },
          { new: true },
        )
        .exec();

      return this.toDomain(userDoc!);
    }

    const newUser = new this.userModel({
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
    });

    const savedUser = await newUser.save();
    return this.toDomain(savedUser);
  }

  private toDomain(doc: UserDocument): User {
    return new User(
      (doc._id as string).toString(),
      doc.email,
      doc.passwordHash,
      doc.role,
      doc.isActive,
      doc.createdAt,
    );
  }
}
