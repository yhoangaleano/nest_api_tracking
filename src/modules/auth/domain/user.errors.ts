import { DomainException } from '../../../core/filters/domain-exception.filter';

export class UserNotFoundError extends DomainException {
  constructor(email: string) {
    super(`User with email ${email} not found`, 'USER_NOT_FOUND');
  }
}

export class InvalidCredentialsError extends DomainException {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
  }
}

export class UserAlreadyExistsError extends DomainException {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 'USER_ALREADY_EXISTS');
  }
}

export class InactiveUserError extends DomainException {
  constructor() {
    super('User account is inactive', 'INACTIVE_USER');
  }
}
