import { UNIT_STATE_ENUMERATION } from './unit-state.enum';

/**
 * Valid state transitions for tracking units
 * Maps each state to the list of states that can follow it
 *
 * Transition rules:
 * - CREATED can transition to PICKED_UP only
 * - Main states follow linear progression to next state
 * - Main states MUST transition to their exception state when there's a problem
 * - Exception states can retry the same state (with incremented attempt_number)
 * - Exception states can transition to the next main state in the flow
 * - DELIVERED is terminal (no transitions allowed)
 *
 * Retry mechanism (MANDATORY exception flow):
 * - OUT_FOR_DELIVERY (attempt=1) → [Problem] → OUT_FOR_DELIVERY_EXCEPTION (attempt=1)
 * - OUT_FOR_DELIVERY_EXCEPTION (attempt=1) → [Retry] → OUT_FOR_DELIVERY (attempt=2)
 * - OUT_FOR_DELIVERY (attempt=2) → [Problem] → OUT_FOR_DELIVERY_EXCEPTION (attempt=2)
 * - OUT_FOR_DELIVERY_EXCEPTION (attempt=2) → [Retry] → OUT_FOR_DELIVERY (attempt=3)
 * - OUT_FOR_DELIVERY (attempt=3) → [Success] → DELIVERED
 *
 * Benefits:
 * - Clear audit trail of all problems
 * - Explicit recording of failures
 * - Better traceability and accountability
 */
export const VALID_STATE_TRANSITIONS: Record<
  UNIT_STATE_ENUMERATION,
  UNIT_STATE_ENUMERATION[]
> = {
  // Main flow transitions
  // Main states can only: progress forward OR go to their exception state
  // NO direct retries - must go through exception state first
  [UNIT_STATE_ENUMERATION.CREATED]: [UNIT_STATE_ENUMERATION.PICKED_UP],

  [UNIT_STATE_ENUMERATION.PICKED_UP]: [
    UNIT_STATE_ENUMERATION.IN_TRANSIT, // Progress to next state
    UNIT_STATE_ENUMERATION.PICKED_UP_EXCEPTION, // Mark problem
  ],

  [UNIT_STATE_ENUMERATION.IN_TRANSIT]: [
    UNIT_STATE_ENUMERATION.AT_FACILITY, // Progress to next state
    UNIT_STATE_ENUMERATION.IN_TRANSIT_EXCEPTION, // Mark problem
  ],

  [UNIT_STATE_ENUMERATION.AT_FACILITY]: [
    UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY, // Progress to next state
    UNIT_STATE_ENUMERATION.AT_FACILITY_EXCEPTION, // Mark problem
  ],

  [UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY]: [
    UNIT_STATE_ENUMERATION.DELIVERED, // Successful delivery
    UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION, // Mark problem
  ],

  // Terminal state
  [UNIT_STATE_ENUMERATION.DELIVERED]: [],

  // Exception state transitions
  // Exception states can RETRY the same state (attempt_number++) or SKIP to next state
  // When retrying: attempt_number increments automatically
  [UNIT_STATE_ENUMERATION.PICKED_UP_EXCEPTION]: [
    UNIT_STATE_ENUMERATION.PICKED_UP, // Retry pickup (attempt++)
    UNIT_STATE_ENUMERATION.IN_TRANSIT, // Skip to next state
  ],

  [UNIT_STATE_ENUMERATION.IN_TRANSIT_EXCEPTION]: [
    UNIT_STATE_ENUMERATION.IN_TRANSIT, // Retry transit (attempt++)
    UNIT_STATE_ENUMERATION.AT_FACILITY, // Continue to facility
  ],

  [UNIT_STATE_ENUMERATION.AT_FACILITY_EXCEPTION]: [
    UNIT_STATE_ENUMERATION.AT_FACILITY, // Retry facility processing (attempt++)
    UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY, // Continue to delivery
  ],

  [UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION]: [
    UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY, // Retry delivery (attempt++)
    UNIT_STATE_ENUMERATION.DELIVERED, // Complete delivery despite exception
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
