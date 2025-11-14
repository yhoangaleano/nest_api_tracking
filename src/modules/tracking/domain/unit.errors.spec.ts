import { UnitState } from './unit-state.enum';
import { InvalidStateTransitionError, UnitNotFoundError } from './unit.errors';
import {
  INVALID_STATE_TRANSITION_ERROR_CODE_CONSTANT,
  UNIT_NOT_FOUND_ERROR_CODE_CONSTANT,
} from '../configs/domain-messages.constants';

describe('domain errors', () => {
  describe('UnitNotFoundError', () => {
    it('should create error with correct message and code', () => {
      const trackingId = 'T-ABC-12345';
      const error = new UnitNotFoundError(trackingId);

      expect(error.message).toBe(
        `Unit with tracking ID ${trackingId} not found`,
      );
      expect(error.code).toBe(UNIT_NOT_FOUND_ERROR_CODE_CONSTANT);
      expect(error.name).toBe('UnitNotFoundError');
    });

    it('should preserve stack trace', () => {
      const error = new UnitNotFoundError('T-ABC-12345');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('UnitNotFoundError');
    });

    it('should be serializable for logging', () => {
      const error = new UnitNotFoundError('T-ABC-12345');
      const serialized = JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
      });

      expect(serialized).toContain('UnitNotFoundError');
      expect(serialized).toContain('T-ABC-12345');
      expect(serialized).toContain(UNIT_NOT_FOUND_ERROR_CODE_CONSTANT);
    });
  });

  describe('InvalidStateTransitionError', () => {
    it('should create error with correct message and code', () => {
      const fromState = UnitState.CREATED;
      const toState = UnitState.DELIVERED;
      const error = new InvalidStateTransitionError(fromState, toState);

      expect(error.message).toBe(
        `Invalid state transition from ${fromState} to ${toState}`,
      );
      expect(error.code).toBe(INVALID_STATE_TRANSITION_ERROR_CODE_CONSTANT);
      expect(error.name).toBe('InvalidStateTransitionError');
    });

    it('should handle all UnitState enum combinations', () => {
      const states = [
        UnitState.CREATED,
        UnitState.PICKED_UP,
        UnitState.IN_TRANSIT,
        UnitState.OUT_FOR_DELIVERY,
        UnitState.DELIVERED,
        UnitState.FAILED_DELIVERY,
        UnitState.RETURNED,
      ];

      for (const fromState of states) {
        for (const toState of states) {
          const error = new InvalidStateTransitionError(fromState, toState);
          expect(error.message).toContain(fromState);
          expect(error.message).toContain(toState);
        }
      }
    });

    it('should preserve stack trace', () => {
      const error = new InvalidStateTransitionError(
        UnitState.CREATED,
        UnitState.DELIVERED,
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('InvalidStateTransitionError');
    });
  });
});
