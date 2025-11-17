// Framework imports
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

// Domain layer
import { USER_REPOSITORY_TOKEN_CONSTANT } from './domain/user.repository';

// Application layer
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';

// Infrastructure layer
import { PostgresUserRepository } from './infrastructure/persistence/postgres-user.repository';
import { UserEntity } from './infrastructure/persistence/entities';
import { JwtService } from './infrastructure/jwt/jwt.service';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';

// Presentation layer
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('jwt.secret')!,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_REPOSITORY_TOKEN_CONSTANT,
      useClass: PostgresUserRepository,
    },
    JwtService,
    JwtStrategy,
    LoginUseCase,
    RegisterUseCase,
    RefreshTokenUseCase,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
