import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import {
  IUserRepository,
  USER_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain/user.repository';
import { InactiveUserError } from '../../domain/user.errors';

import { TokenResponseDto } from '../dtos/token-response.dto';

import { JwtService } from '../../infrastructure/jwt/jwt.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN_CONSTANT)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verifyRefreshToken(refreshToken);
      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new InactiveUserError();
      }

      const accessToken = this.jwtService.generateAccessToken(user);
      const newRefreshToken = this.jwtService.generateRefreshToken(user);
      const expiresIn = this.jwtService.getExpiresIn();

      return TokenResponseDto.create(accessToken, newRefreshToken, expiresIn);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
