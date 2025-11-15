import { Checkpoint } from './checkpoint.entity';
import { Unit } from './unit.entity';
import { UNIT_STATE_ENUMERATION } from './unit-state.enumeration';
import { InvalidStateTransitionError } from './unit.errors';
import {
  INITIAL_CHECKPOINT_LOCATION_CONSTANT,
  INITIAL_CHECKPOINT_MESSAGE_CONSTANT,
} from './unit.constants';

describe('unit entity', () => {
  describe('create', () => {
    it('should create a new unit with CREATED status', () => {
      const trackingId = 'T-ABC-12345';
      const unit = Unit.create(trackingId);

      expect(unit.trackingId).toBe(trackingId);
      expect(unit.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      expect(unit.id).toBeNull();
    });

    it('should create unit with initial checkpoint', () => {
      const trackingId = 'T-ABC-12345';
      const unit = Unit.create(trackingId);

      expect(unit.checkpoints).toHaveLength(1);
      const initialCheckpoint = unit.checkpoints[0];
      expect(initialCheckpoint).toBeDefined();
      expect(initialCheckpoint!.status).toBe(UNIT_STATE_ENUMERATION.CREATED);
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
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'WAREHOUSE_A',
        new Date(),
        'Package picked up from warehouse',
      );

      unit.addCheckpoint(checkpoint);

      expect(unit.currentState).toBe(UNIT_STATE_ENUMERATION.PICKED_UP);
      expect(unit.checkpoints).toHaveLength(2);
      expect(unit.checkpoints[1]).toBe(checkpoint);
    });

    it('should reject invalid transition: CREATED → DELIVERED', () => {
      const unit = Unit.create('T-ABC-12345');
      const checkpoint = Checkpoint.create(
        UNIT_STATE_ENUMERATION.DELIVERED,
        'CUSTOMER_ADDRESS',
        new Date(),
      );

      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        InvalidStateTransitionError,
      );
      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        'Invalid state transition from CREATED to DELIVERED',
      );

      expect(unit.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      expect(unit.checkpoints).toHaveLength(1);
    });

    it('should reject invalid transition: CREATED → IN_TRANSIT', () => {
      const unit = Unit.create('T-ABC-12345');
      const checkpoint = Checkpoint.create(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
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
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date(),
        ),
      );

      const backwardCheckpoint = Checkpoint.create(
        UNIT_STATE_ENUMERATION.CREATED,
        'SYSTEM',
        new Date(),
      );

      expect(() => unit.addCheckpoint(backwardCheckpoint)).toThrow(
        InvalidStateTransitionError,
      );
      expect(unit.currentState).toBe(UNIT_STATE_ENUMERATION.PICKED_UP);
    });

    it('should reject backwards transition: IN_TRANSIT → PICKED_UP', () => {
      const unit = Unit.create('T-ABC-12345');
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK_A123',
          new Date(),
        ),
      );

      const backwardCheckpoint = Checkpoint.create(
        UNIT_STATE_ENUMERATION.PICKED_UP,
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
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK_A123',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'DELIVERY_VAN_B456',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.DELIVERED,
          'CUSTOMER_ADDRESS',
          new Date(),
        ),
      );

      const checkpoint = Checkpoint.create(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
        'TRUCK_A123',
        new Date(),
      );

      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        InvalidStateTransitionError,
      );
      expect(unit.currentState).toBe(UNIT_STATE_ENUMERATION.DELIVERED);
    });

    it('should reject transition from final state RETURNED', () => {
      const unit = Unit.create('T-ABC-12345');
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK_A123',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
          'CUSTOMER_ADDRESS',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.RETURNED,
          'WAREHOUSE_A',
          new Date(),
        ),
      );

      const checkpoint = Checkpoint.create(
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'WAREHOUSE_A',
        new Date(),
      );

      expect(() => unit.addCheckpoint(checkpoint)).toThrow(
        InvalidStateTransitionError,
      );
      expect(unit.currentState).toBe(UNIT_STATE_ENUMERATION.RETURNED);
    });

    it('should maintain checkpoint order chronologically', () => {
      const unit = Unit.create('T-ABC-12345');

      const checkpoint1 = Checkpoint.create(
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'WAREHOUSE_A',
        new Date('2025-01-12T10:00:00Z'),
      );
      const checkpoint2 = Checkpoint.create(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
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
        UNIT_STATE_ENUMERATION.PICKED_UP,
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
      const validTransitionsMap: Record<
        UNIT_STATE_ENUMERATION,
        UNIT_STATE_ENUMERATION[]
      > = {
        [UNIT_STATE_ENUMERATION.CREATED]: [UNIT_STATE_ENUMERATION.PICKED_UP],
        [UNIT_STATE_ENUMERATION.PICKED_UP]: [UNIT_STATE_ENUMERATION.IN_TRANSIT],
        [UNIT_STATE_ENUMERATION.IN_TRANSIT]: [
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
        ],
        [UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY]: [
          UNIT_STATE_ENUMERATION.DELIVERED,
          UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
        ],
        [UNIT_STATE_ENUMERATION.DELIVERED]: [],
        [UNIT_STATE_ENUMERATION.FAILED_DELIVERY]: [
          UNIT_STATE_ENUMERATION.RETURNED,
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
        ],
        [UNIT_STATE_ENUMERATION.RETURNED]: [],
      };

      for (const [fromState, allowedToStates] of Object.entries(
        validTransitionsMap,
      )) {
        const unit = Unit.create('T-TEST-00000');

        const statesPath = getPathToState(fromState as UNIT_STATE_ENUMERATION);
        for (const state of statesPath) {
          if (state !== UNIT_STATE_ENUMERATION.CREATED) {
            unit.addCheckpoint(
              Checkpoint.create(state, 'LOCATION', new Date()),
            );
          }
        }

        for (const toState of allowedToStates) {
          const testUnit = Unit.create('T-TEST-00001');
          for (const state of statesPath) {
            if (state !== UNIT_STATE_ENUMERATION.CREATED) {
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
        Checkpoint.create(UNIT_STATE_ENUMERATION.PICKED_UP, 'LOC1', new Date()),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'LOC2',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'LOC3',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(UNIT_STATE_ENUMERATION.DELIVERED, 'LOC4', new Date()),
      );

      expect(unit.checkpoints).toHaveLength(5);
      expect(unit.currentState).toBe(UNIT_STATE_ENUMERATION.DELIVERED);
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
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date(),
        ),
      );

      expect(unit.id).toBe(originalId);
      expect(unit.trackingId).toBe(originalTrackingId);
    });
  });
});

function getPathToState(
  targetState: UNIT_STATE_ENUMERATION,
): UNIT_STATE_ENUMERATION[] {
  const paths: Record<UNIT_STATE_ENUMERATION, UNIT_STATE_ENUMERATION[]> = {
    [UNIT_STATE_ENUMERATION.CREATED]: [UNIT_STATE_ENUMERATION.CREATED],
    [UNIT_STATE_ENUMERATION.PICKED_UP]: [
      UNIT_STATE_ENUMERATION.CREATED,
      UNIT_STATE_ENUMERATION.PICKED_UP,
    ],
    [UNIT_STATE_ENUMERATION.IN_TRANSIT]: [
      UNIT_STATE_ENUMERATION.CREATED,
      UNIT_STATE_ENUMERATION.PICKED_UP,
      UNIT_STATE_ENUMERATION.IN_TRANSIT,
    ],
    [UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY]: [
      UNIT_STATE_ENUMERATION.CREATED,
      UNIT_STATE_ENUMERATION.PICKED_UP,
      UNIT_STATE_ENUMERATION.IN_TRANSIT,
      UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
    ],
    [UNIT_STATE_ENUMERATION.DELIVERED]: [
      UNIT_STATE_ENUMERATION.CREATED,
      UNIT_STATE_ENUMERATION.PICKED_UP,
      UNIT_STATE_ENUMERATION.IN_TRANSIT,
      UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      UNIT_STATE_ENUMERATION.DELIVERED,
    ],
    [UNIT_STATE_ENUMERATION.FAILED_DELIVERY]: [
      UNIT_STATE_ENUMERATION.CREATED,
      UNIT_STATE_ENUMERATION.PICKED_UP,
      UNIT_STATE_ENUMERATION.IN_TRANSIT,
      UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
    ],
    [UNIT_STATE_ENUMERATION.RETURNED]: [
      UNIT_STATE_ENUMERATION.CREATED,
      UNIT_STATE_ENUMERATION.PICKED_UP,
      UNIT_STATE_ENUMERATION.IN_TRANSIT,
      UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
      UNIT_STATE_ENUMERATION.RETURNED,
    ],
  };

  return paths[targetState] || [UNIT_STATE_ENUMERATION.CREATED];
}
