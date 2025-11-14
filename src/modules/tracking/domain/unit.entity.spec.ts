import { Checkpoint } from './checkpoint.entity';
import { Unit } from './unit.entity';
import { UnitState } from './unit-state.enum';
import { InvalidStateTransitionError } from './unit.errors';
import {
  INITIAL_CHECKPOINT_LOCATION_CONSTANT,
  INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
} from '../configs/domain-messages.constants';

describe('unit entity', () => {
  describe('create', () => {
    it('should create a new unit with CREATED status', () => {
      const trackingId = 'T-ABC-12345';
      const unit = Unit.create(trackingId);

      expect(unit.trackingId).toBe(trackingId);
      expect(unit.currentState).toBe(UnitState.CREATED);
      expect(unit.id).toBeNull();
    });

    it('should create unit with initial checkpoint', () => {
      const trackingId = 'T-ABC-12345';
      const unit = Unit.create(trackingId);

      expect(unit.checkpoints).toHaveLength(1);
      const initialCheckpoint = unit.checkpoints[0];
      expect(initialCheckpoint).toBeDefined();
      expect(initialCheckpoint!.status).toBe(UnitState.CREATED);
      expect(initialCheckpoint!.location).toBe(
        INITIAL_CHECKPOINT_LOCATION_CONSTANT,
      );
      expect(initialCheckpoint!.notes).toBe(
        INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
      );
    });

    it('should create unit with timestamp for initial checkpoint', () => {
      const unit = Unit.create('T-ABC-12345');
      const checkpoint = unit.checkpoints[0];

      expect(checkpoint).toBeDefined();
      expect(checkpoint!.timestamp).toBeInstanceOf(Date);
      expect(checkpoint!.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('addCheckpoint', () => {
    it('should add checkpoint and update current state', () => {
      const unit = Unit.create('T-ABC-12345');
      const checkpoint = Checkpoint.create(
        UnitState.PICKED_UP,
        'WAREHOUSE_A',
        new Date(),
        'Package picked up from warehouse',
      );

      unit.addCheckpoint(checkpoint);

      expect(unit.currentState).toBe(UnitState.PICKED_UP);
      expect(unit.checkpoints).toHaveLength(2);
      expect(unit.checkpoints[1]).toBe(checkpoint);
    });

    it('should reject invalid transition: CREATED → DELIVERED', () => {
      const unit = Unit.create('T-ABC-12345');
      const checkpoint = Checkpoint.create(
        UnitState.DELIVERED,
        'CUSTOMER_ADDRESS',
        new Date(),
      );

      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        InvalidStateTransitionError,
      );
      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        'Invalid state transition from CREATED to DELIVERED',
      );

      expect(unit.currentState).toBe(UnitState.CREATED);
      expect(unit.checkpoints).toHaveLength(1);
    });

    it('should reject invalid transition: CREATED → IN_TRANSIT', () => {
      const unit = Unit.create('T-ABC-12345');
      const checkpoint = Checkpoint.create(
        UnitState.IN_TRANSIT,
        'TRUCK_A123',
        new Date(),
      );

      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        InvalidStateTransitionError,
      );
    });

    it('should reject backwards transition: PICKED_UP → CREATED', () => {
      const unit = Unit.create('T-ABC-12345');
      unit.addCheckpoint(
        Checkpoint.create(UnitState.PICKED_UP, 'WAREHOUSE_A', new Date()),
      );

      const backwardCheckpoint = Checkpoint.create(
        UnitState.CREATED,
        'SYSTEM',
        new Date(),
      );

      expect(() => unit.addCheckpoint(backwardCheckpoint)).toThrow(
        InvalidStateTransitionError,
      );
      expect(unit.currentState).toBe(UnitState.PICKED_UP);
    });

    it('should reject backwards transition: IN_TRANSIT → PICKED_UP', () => {
      const unit = Unit.create('T-ABC-12345');
      unit.addCheckpoint(
        Checkpoint.create(UnitState.PICKED_UP, 'WAREHOUSE_A', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(UnitState.IN_TRANSIT, 'TRUCK_A123', new Date()),
      );

      const backwardCheckpoint = Checkpoint.create(
        UnitState.PICKED_UP,
        'WAREHOUSE_A',
        new Date(),
      );

      expect(() => unit.addCheckpoint(backwardCheckpoint)).toThrow(
        InvalidStateTransitionError,
      );
    });

    it('should reject transition from final state DELIVERED', () => {
      const unit = Unit.create('T-ABC-12345');
      unit.addCheckpoint(
        Checkpoint.create(UnitState.PICKED_UP, 'WAREHOUSE_A', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(UnitState.IN_TRANSIT, 'TRUCK_A123', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UnitState.OUT_FOR_DELIVERY,
          'DELIVERY_VAN_B456',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(UnitState.DELIVERED, 'CUSTOMER_ADDRESS', new Date()),
      );

      const checkpoint = Checkpoint.create(
        UnitState.IN_TRANSIT,
        'TRUCK_A123',
        new Date(),
      );

      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        InvalidStateTransitionError,
      );
      expect(unit.currentState).toBe(UnitState.DELIVERED);
    });

    it('should reject transition from final state RETURNED', () => {
      const unit = Unit.create('T-ABC-12345');
      unit.addCheckpoint(
        Checkpoint.create(UnitState.PICKED_UP, 'WAREHOUSE_A', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(UnitState.IN_TRANSIT, 'TRUCK_A123', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UnitState.FAILED_DELIVERY,
          'CUSTOMER_ADDRESS',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(UnitState.RETURNED, 'WAREHOUSE_A', new Date()),
      );

      const checkpoint = Checkpoint.create(
        UnitState.PICKED_UP,
        'WAREHOUSE_A',
        new Date(),
      );

      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        InvalidStateTransitionError,
      );
      expect(unit.currentState).toBe(UnitState.RETURNED);
    });

    it('should maintain checkpoint order chronologically', () => {
      const unit = Unit.create('T-ABC-12345');

      const checkpoint1 = Checkpoint.create(
        UnitState.PICKED_UP,
        'WAREHOUSE_A',
        new Date('2025-01-12T10:00:00Z'),
      );
      const checkpoint2 = Checkpoint.create(
        UnitState.IN_TRANSIT,
        'TRUCK_A123',
        new Date('2025-01-12T11:00:00Z'),
      );

      unit.addCheckpoint(checkpoint1);
      unit.addCheckpoint(checkpoint2);

      expect(unit.checkpoints).toHaveLength(3);
      expect(unit.checkpoints[1]).toBe(checkpoint1);
      expect(unit.checkpoints[2]).toBe(checkpoint2);
    });

    it('should preserve checkpoint notes when adding', () => {
      const unit = Unit.create('T-ABC-12345');
      const notes = 'Package handled with care';
      const checkpoint = Checkpoint.create(
        UnitState.PICKED_UP,
        'WAREHOUSE_A',
        new Date(),
        notes,
      );

      unit.addCheckpoint(checkpoint);

      const addedCheckpoint = unit.checkpoints[1];
      expect(addedCheckpoint).toBeDefined();
      expect(addedCheckpoint!.notes).toBe(notes);
    });
  });

  describe('state machine validation', () => {
    it('should have correct valid transitions map for all states', () => {
      const validTransitionsMap: Record<UnitState, UnitState[]> = {
        [UnitState.CREATED]: [UnitState.PICKED_UP],
        [UnitState.PICKED_UP]: [UnitState.IN_TRANSIT],
        [UnitState.IN_TRANSIT]: [
          UnitState.OUT_FOR_DELIVERY,
          UnitState.FAILED_DELIVERY,
        ],
        [UnitState.OUT_FOR_DELIVERY]: [
          UnitState.DELIVERED,
          UnitState.FAILED_DELIVERY,
        ],
        [UnitState.DELIVERED]: [],
        [UnitState.FAILED_DELIVERY]: [UnitState.RETURNED, UnitState.IN_TRANSIT],
        [UnitState.RETURNED]: [],
      };

      for (const [fromState, allowedToStates] of Object.entries(
        validTransitionsMap,
      )) {
        const unit = Unit.create('T-TEST-00000');

        const statesPath = getPathToState(fromState as UnitState);
        for (const state of statesPath) {
          if (state !== UnitState.CREATED) {
            unit.addCheckpoint(
              Checkpoint.create(state, 'LOCATION', new Date()),
            );
          }
        }

        for (const toState of allowedToStates) {
          const testUnit = Unit.create('T-TEST-00001');
          for (const state of statesPath) {
            if (state !== UnitState.CREATED) {
              testUnit.addCheckpoint(
                Checkpoint.create(state, 'LOCATION', new Date()),
              );
            }
          }

          expect(() =>
            testUnit.addCheckpoint(
              Checkpoint.create(toState, 'LOCATION', new Date()),
            ),
          ).not.toThrow();
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle multiple transitions in sequence', () => {
      const unit = Unit.create('T-ABC-12345');

      unit.addCheckpoint(
        Checkpoint.create(UnitState.PICKED_UP, 'LOC1', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(UnitState.IN_TRANSIT, 'LOC2', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(UnitState.OUT_FOR_DELIVERY, 'LOC3', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(UnitState.DELIVERED, 'LOC4', new Date()),
      );

      expect(unit.checkpoints).toHaveLength(5);
      expect(unit.currentState).toBe(UnitState.DELIVERED);
    });

    it('should handle tracking ID with special characters', () => {
      const specialTrackingId = 'T-XYZ-99999';
      const unit = Unit.create(specialTrackingId);

      expect(unit.trackingId).toBe(specialTrackingId);
    });

    it('should maintain unit immutability for id and trackingId', () => {
      const unit = Unit.create('T-ABC-12345');
      const originalId = unit.id;
      const originalTrackingId = unit.trackingId;

      unit.addCheckpoint(
        Checkpoint.create(UnitState.PICKED_UP, 'WAREHOUSE_A', new Date()),
      );

      expect(unit.id).toBe(originalId);
      expect(unit.trackingId).toBe(originalTrackingId);
    });
  });
});

function getPathToState(targetState: UnitState): UnitState[] {
  const paths: Record<UnitState, UnitState[]> = {
    [UnitState.CREATED]: [UnitState.CREATED],
    [UnitState.PICKED_UP]: [UnitState.CREATED, UnitState.PICKED_UP],
    [UnitState.IN_TRANSIT]: [
      UnitState.CREATED,
      UnitState.PICKED_UP,
      UnitState.IN_TRANSIT,
    ],
    [UnitState.OUT_FOR_DELIVERY]: [
      UnitState.CREATED,
      UnitState.PICKED_UP,
      UnitState.IN_TRANSIT,
      UnitState.OUT_FOR_DELIVERY,
    ],
    [UnitState.DELIVERED]: [
      UnitState.CREATED,
      UnitState.PICKED_UP,
      UnitState.IN_TRANSIT,
      UnitState.OUT_FOR_DELIVERY,
      UnitState.DELIVERED,
    ],
    [UnitState.FAILED_DELIVERY]: [
      UnitState.CREATED,
      UnitState.PICKED_UP,
      UnitState.IN_TRANSIT,
      UnitState.FAILED_DELIVERY,
    ],
    [UnitState.RETURNED]: [
      UnitState.CREATED,
      UnitState.PICKED_UP,
      UnitState.IN_TRANSIT,
      UnitState.FAILED_DELIVERY,
      UnitState.RETURNED,
    ],
  };

  return paths[targetState] || [UnitState.CREATED];
}
