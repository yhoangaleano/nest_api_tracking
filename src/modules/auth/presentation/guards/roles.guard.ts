import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { USER_ROLE_ENUMERATION } from '../../domain/user-role.enum';
import { User } from '../../domain/user.entity';

import { ROLES_KEY_CONSTANT } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      USER_ROLE_ENUMERATION[]
    >(ROLES_KEY_CONSTANT, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: User } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
