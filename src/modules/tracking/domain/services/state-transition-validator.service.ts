import { Injectable } from '@nestjs/common';

import { UNIT_STATE_ENUMERATION } from '../configs/unit-state.enum';
import { isValidTransition } from '../configs/state-transitions';
import { InvalidStateTransitionException } from '../exceptions/invalid-state-transition.exception';

/**
 * Domain service responsible for validating state transitions
 * Ensures business rules for unit state changes are enforced
 */
@Injectable()
export class StateTransitionValidatorService {
  /**
   * Validates if a state transition is allowed
   * @param currentState - The current state of the unit
   * @param newState - The proposed new state
   * @throws InvalidStateTransitionException if the transition is not allowed
   */
  validateTransition(
    currentState: UNIT_STATE_ENUMERATION,
    newState: UNIT_STATE_ENUMERATION,
  ): void {
    if (!isValidTransition(currentState, newState)) {
      throw new InvalidStateTransitionException(currentState, newState);
    }
  }

  /**
   * Checks if a state transition is valid without throwing an exception
   * @param currentState - The current state of the unit
   * @param newState - The proposed new state
   * @returns true if the transition is valid, false otherwise
   */
  canTransition(
    currentState: UNIT_STATE_ENUMERATION,
    newState: UNIT_STATE_ENUMERATION,
  ): boolean {
    return isValidTransition(currentState, newState);
  }

  /**
   * Determines if a state is a terminal state (no further transitions allowed)
   * @param state - The state to check
   * @returns true if the state is terminal
   */
  isTerminalState(state: UNIT_STATE_ENUMERATION): boolean {
    return state === UNIT_STATE_ENUMERATION.DELIVERED;
  }

  /**
   * Determines if a state is an exception state
   * @param state - The state to check
   * @returns true if the state is an exception state
   */
  isExceptionState(state: UNIT_STATE_ENUMERATION): boolean {
    return (
      state === UNIT_STATE_ENUMERATION.PICKED_UP_EXCEPTION ||
      state === UNIT_STATE_ENUMERATION.IN_TRANSIT_EXCEPTION ||
      state === UNIT_STATE_ENUMERATION.AT_FACILITY_EXCEPTION ||
      state === UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION
    );
  }
}
