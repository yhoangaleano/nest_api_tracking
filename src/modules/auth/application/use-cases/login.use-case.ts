import { Inject, Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import {
  IUserRepository,
  USER_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain/user.repository';
import {
  InactiveUserError,
  InvalidCredentialsError,
} from '../../domain/user.errors';

import { TokenResponseDto } from '../dtos/token-response.dto';

import { JwtService } from '../../infrastructure/jwt/jwt.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN_CONSTANT)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(email: string, password: string): Promise<TokenResponseDto> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new InactiveUserError();
    }

    const accessToken = this.jwtService.generateAccessToken(user);
    const refreshToken = this.jwtService.generateRefreshToken(user);
    const expiresIn = this.jwtService.getExpiresIn();

    return TokenResponseDto.create(accessToken, refreshToken, expiresIn);
  }
}
