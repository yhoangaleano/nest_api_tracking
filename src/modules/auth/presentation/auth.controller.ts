import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LoggerService } from '../../../core/logger/logger.service';

import { LoginDto } from '../application/dtos/login.dto';
import { RegisterDto } from '../application/dtos/register.dto';
import { TokenResponseDto } from '../application/dtos/token-response.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../application/use-cases/register.use-case';

import {
  InactiveUserError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
} from '../domain/user.errors';

import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthController');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    this.logger.log(`Login attempt for user: ${loginDto.email}`);

    try {
      const result = await this.loginUseCase.execute(
        loginDto.email,
        loginDto.password,
      );
      this.logger.log(`Login successful for user: ${loginDto.email}`);
      return result;
    } catch (error) {
      if (
        error instanceof InvalidCredentialsError ||
        error instanceof InactiveUserError
      ) {
        this.logger.warn(
          `Login failed for user: ${loginDto.email} - ${(error as Error).message}`,
        );
        throw new UnauthorizedException(error.message);
      }
      this.logger.error(
        `Login error for user: ${loginDto.email}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    this.logger.log(`Registration attempt for user: ${registerDto.email}`);

    try {
      const result = await this.registerUseCase.execute(
        registerDto.email,
        registerDto.password,
        registerDto.role,
      );
      this.logger.log(
        `User registered successfully: ${registerDto.email} with role: ${registerDto.role}`,
      );
      return result;
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        this.logger.warn(
          `Registration failed - user already exists: ${registerDto.email}`,
        );
        throw new UnauthorizedException(error.message);
      }
      this.logger.error(
        `Registration error for user: ${registerDto.email}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<TokenResponseDto> {
    return await this.refreshTokenUseCase.execute(refreshToken);
  }
}
