import { DomainException } from './domain.exception';
import { UNIT_STATE_ENUMERATION } from '../configs/unit-state.enum';

/**
 * Exception thrown when an invalid state transition is attempted
 */
export class InvalidStateTransitionException extends DomainException {
  constructor(
    currentState: UNIT_STATE_ENUMERATION,
    attemptedState: UNIT_STATE_ENUMERATION,
  ) {
    super(
      `Invalid state transition from ${currentState} to ${attemptedState}`,
      'INVALID_STATE_TRANSITION',
    );
  }
}
