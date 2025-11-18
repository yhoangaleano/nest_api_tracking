import { UNIT_STATE_ENUMERATION } from './unit-state.enum';
import { InvalidStateTransitionError } from '../exceptions/unit.errors';

export const VALID_STATE_TRANSITIONS: Record<
  UNIT_STATE_ENUMERATION,
  UNIT_STATE_ENUMERATION[]
> = {
  [UNIT_STATE_ENUMERATION.CREATED]: [UNIT_STATE_ENUMERATION.PICKED_UP],

  [UNIT_STATE_ENUMERATION.PICKED_UP]: [
    UNIT_STATE_ENUMERATION.IN_TRANSIT,
    UNIT_STATE_ENUMERATION.PICKED_UP_EXCEPTION,
  ],

  [UNIT_STATE_ENUMERATION.IN_TRANSIT]: [
    UNIT_STATE_ENUMERATION.AT_FACILITY,
    UNIT_STATE_ENUMERATION.IN_TRANSIT_EXCEPTION,
  ],

  [UNIT_STATE_ENUMERATION.AT_FACILITY]: [
    UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
    UNIT_STATE_ENUMERATION.AT_FACILITY_EXCEPTION,
  ],

  [UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY]: [
    UNIT_STATE_ENUMERATION.DELIVERED,
    UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION,
  ],

  [UNIT_STATE_ENUMERATION.DELIVERED]: [],

  [UNIT_STATE_ENUMERATION.PICKED_UP_EXCEPTION]: [
    UNIT_STATE_ENUMERATION.PICKED_UP,
    UNIT_STATE_ENUMERATION.IN_TRANSIT,
  ],

  [UNIT_STATE_ENUMERATION.IN_TRANSIT_EXCEPTION]: [
    UNIT_STATE_ENUMERATION.IN_TRANSIT,
    UNIT_STATE_ENUMERATION.AT_FACILITY,
  ],

  [UNIT_STATE_ENUMERATION.AT_FACILITY_EXCEPTION]: [
    UNIT_STATE_ENUMERATION.AT_FACILITY,
    UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
  ],

  [UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION]: [
    UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
    UNIT_STATE_ENUMERATION.DELIVERED,
  ],
};

/**
 * Helper function to check if a state transition is valid
 * @param currentState - The current state of the unit
 * @param newState - The proposed new state
 * @returns true if the transition is valid, false otherwise
 */
export function isValidTransition(
  currentState: UNIT_STATE_ENUMERATION,
  newState: UNIT_STATE_ENUMERATION,
): boolean {
  const validNextStates = VALID_STATE_TRANSITIONS[currentState];
  return validNextStates.includes(newState);
}

/**
 * Validates a state transition and throws an error if invalid
 * Pure function - no dependencies, no side effects (except throwing)
 *
 * @param currentState - The current state of the unit
 * @param newState - The proposed new state
 * @throws InvalidStateTransitionError if the transition is not allowed
 */
export function validateStateTransition(
  currentState: UNIT_STATE_ENUMERATION,
  newState: UNIT_STATE_ENUMERATION,
): void {
  if (!isValidTransition(currentState, newState)) {
    throw new InvalidStateTransitionError(currentState, newState);
  }
}

/**
 * Checks if a state is a terminal state (no further transitions allowed)
 * Pure function
 *
 * @param state - The state to check
 * @returns true if the state is terminal
 */
export function isTerminalState(state: UNIT_STATE_ENUMERATION): boolean {
  return state === UNIT_STATE_ENUMERATION.DELIVERED;
}

/**
 * Checks if a state is an exception state
 * Pure function
 *
 * @param state - The state to check
 * @returns true if the state is an exception state
 */
export function isExceptionState(state: UNIT_STATE_ENUMERATION): boolean {
  return (
    state === UNIT_STATE_ENUMERATION.PICKED_UP_EXCEPTION ||
    state === UNIT_STATE_ENUMERATION.IN_TRANSIT_EXCEPTION ||
    state === UNIT_STATE_ENUMERATION.AT_FACILITY_EXCEPTION ||
    state === UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION
  );
}
