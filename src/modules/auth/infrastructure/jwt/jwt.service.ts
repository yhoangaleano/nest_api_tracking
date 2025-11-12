import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';

import { User } from '../../domain/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id!,
      email: user.email,
      role: user.role,
    };

    return this.nestJwtService.sign(payload);
  }

  generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id!,
      email: user.email,
      role: user.role,
    };

    const secret = this.configService.get<string>('jwt.refreshSecret')!;
    const expiresIn = this.configService.get<string>('jwt.refreshExpiration')!;

    const options = {
      secret,
      expiresIn: expiresIn as unknown as
        | number
        | `${number}ms`
        | `${number}s`
        | `${number}m`
        | `${number}h`
        | `${number}d`,
    };

    return this.nestJwtService.sign(payload, options);
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.nestJwtService.verify(token, {
      secret: this.configService.get<string>('jwt.secret')!,
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.nestJwtService.verify(token, {
      secret: this.configService.get<string>('jwt.refreshSecret')!,
    });
  }

  getExpiresIn(): number {
    const expiration = this.configService.get<string>('jwt.expiration');
    if (expiration?.endsWith('h')) {
      return Number.parseInt(expiration) * 3600;
    }
    if (expiration?.endsWith('d')) {
      return Number.parseInt(expiration) * 86400;
    }
    return 3600;
  }
}
