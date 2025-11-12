import { Inject, Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import {
  IUserRepository,
  USER_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain/user.repository';
import { User } from '../../domain/user.entity';
import { USER_ROLE_ENUMERATION } from '../../domain/user-role.enum';
import { UserAlreadyExistsError } from '../../domain/user.errors';

import { TokenResponseDto } from '../dtos/token-response.dto';

import { JwtService } from '../../infrastructure/jwt/jwt.service';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN_CONSTANT)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    email: string,
    password: string,
    role: USER_ROLE_ENUMERATION = USER_ROLE_ENUMERATION.VIEWER,
  ): Promise<TokenResponseDto> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new UserAlreadyExistsError(email);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = User.create(email, passwordHash, role);
    const savedUser = await this.userRepository.save(user);

    const accessToken = this.jwtService.generateAccessToken(savedUser);
    const refreshToken = this.jwtService.generateRefreshToken(savedUser);
    const expiresIn = this.jwtService.getExpiresIn();

    return TokenResponseDto.create(accessToken, refreshToken, expiresIn);
  }
}
