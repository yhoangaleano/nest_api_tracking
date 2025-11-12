import { USER_ROLE_ENUMERATION } from './user-role.enum';

export class User {
  constructor(
    public readonly id: string | null,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: USER_ROLE_ENUMERATION,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(
    email: string,
    passwordHash: string,
    role: USER_ROLE_ENUMERATION = USER_ROLE_ENUMERATION.VIEWER,
  ): User {
    return new User(null, email, passwordHash, role, true, new Date());
  }

  isAdmin(): boolean {
    return this.role === USER_ROLE_ENUMERATION.ADMIN;
  }

  canOperate(): boolean {
    return (
      this.role === USER_ROLE_ENUMERATION.ADMIN ||
      this.role === USER_ROLE_ENUMERATION.OPERATOR
    );
  }
}
