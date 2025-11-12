import { SetMetadata } from '@nestjs/common';

import { USER_ROLE_ENUMERATION } from '../../domain/user-role.enum';

export const ROLES_KEY_CONSTANT = 'roles';

export const Roles = (...roles: USER_ROLE_ENUMERATION[]) =>
  SetMetadata(ROLES_KEY_CONSTANT, roles);
