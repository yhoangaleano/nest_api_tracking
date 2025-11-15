import { DomainException } from '../../../shared/domain/domain.exception';
import {
  INVALID_STATE_TRANSITION_ERROR_CODE_CONSTANT,
  UNIT_NOT_FOUND_ERROR_CODE_CONSTANT,
} from './unit.constants';

export class InvalidStateTransitionError extends DomainException {
  constructor(from: string, to: string) {
    super(
      `Invalid state transition from ${from} to ${to}`,
      INVALID_STATE_TRANSITION_ERROR_CODE_CONSTANT,
    );
  }
}

export class UnitNotFoundError extends DomainException {
  constructor(trackingId: string) {
    super(
      `Unit with tracking ID ${trackingId} not found`,
      UNIT_NOT_FOUND_ERROR_CODE_CONSTANT,
    );
  }
}
