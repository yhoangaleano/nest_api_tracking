import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { USER_ROLE_ENUMERATION } from '../../domain/user-role.enum';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsEnum(USER_ROLE_ENUMERATION)
  @IsOptional()
  role?: USER_ROLE_ENUMERATION;
}
