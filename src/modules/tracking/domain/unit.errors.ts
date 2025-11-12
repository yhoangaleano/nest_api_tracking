import { DomainException } from '../../../core/filters/domain-exception.filter';

export class InvalidStateTransitionError extends DomainException {
  constructor(from: string, to: string) {
    super(
      `Invalid state transition from ${from} to ${to}`,
      'INVALID_STATE_TRANSITION',
    );
  }
}

export class UnitNotFoundError extends DomainException {
  constructor(trackingId: string) {
    super(`Unit with tracking ID ${trackingId} not found`, 'UNIT_NOT_FOUND');
  }
}
