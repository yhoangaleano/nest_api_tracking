import { RegisterCheckpointUseCase } from './register-checkpoint.use-case';

import {
  Unit,
  CheckpointData,
  InvalidStateTransitionError,
  IUnitRepository,
} from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

describe('register checkpoint use case', () => {
  let useCase: RegisterCheckpointUseCase;
  let mockRepository: jest.Mocked<IUnitRepository>;

  beforeEach(() => {
    mockRepository = {
      findByTrackingId: jest.fn(),
      save: jest.fn(),
      findByState: jest.fn(),
    } as jest.Mocked<IUnitRepository>;

    // Plain class instantiation - no NestJS DI needed
    useCase = new RegisterCheckpointUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create new unit when tracking ID does not exist', async () => {
      const checkpointData = CheckpointData.create(
        'TRK-12345',
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'ORIGIN_WAREHOUSE',
        new Date().toISOString(),
      );

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(checkpointData);

      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(
        checkpointData.trackingId,
      );
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedUnit = mockRepository.save.mock.calls[0]![0];
      expect(savedUnit.trackingId).toBe(checkpointData.trackingId);
      expect(savedUnit.currentState).toBe(UNIT_STATE_ENUMERATION.PICKED_UP);
    });

    it('should add checkpoint to existing unit', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);

      const checkpointData = CheckpointData.create(
        trackingId,
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'WAREHOUSE_A',
        new Date().toISOString(),
      );

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(checkpointData);

      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(trackingId);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      const savedUnit = mockRepository.save.mock.calls[0]![0];
      expect(savedUnit.currentState).toBe(UNIT_STATE_ENUMERATION.PICKED_UP);
      expect(savedUnit.checkpoints).toHaveLength(2);
    });

    it('should update unit through multiple valid transitions', async () => {
      const trackingId = 'T-ABC-12345';
      let currentUnit = Unit.create(trackingId);

      mockRepository.findByTrackingId.mockResolvedValue(currentUnit);
      mockRepository.save.mockImplementation((unit) => {
        currentUnit = unit;
        return Promise.resolve(unit);
      });

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date().toISOString(),
        ),
      );

      expect(currentUnit.currentState).toBe(UNIT_STATE_ENUMERATION.PICKED_UP);

      mockRepository.findByTrackingId.mockResolvedValue(currentUnit);

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK_A123',
          new Date().toISOString(),
        ),
      );

      expect(currentUnit.currentState).toBe(UNIT_STATE_ENUMERATION.IN_TRANSIT);
      expect(currentUnit.checkpoints).toHaveLength(3);
    });

    it('should include notes when provided', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);
      const notes = 'Package handled with special care';

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date().toISOString(),
          notes,
        ),
      );

      const savedUnit = mockRepository.save.mock.calls[0]![0];
      const addedCheckpoint =
        savedUnit.checkpoints[savedUnit.checkpoints.length - 1];
      expect(addedCheckpoint).toBeDefined();
      expect(addedCheckpoint!.notes).toBe(notes);
    });

    it('should throw InvalidStateTransitionError for invalid transition', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);

      const checkpointData = CheckpointData.create(
        trackingId,
        UNIT_STATE_ENUMERATION.DELIVERED,
        'CUSTOMER_ADDRESS',
        new Date().toISOString(),
      );

      await expect(useCase.execute(checkpointData)).rejects.toThrow(
        InvalidStateTransitionError,
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository findByTrackingId errors', async () => {
      const checkpointData = CheckpointData.create(
        'T-ABC-12345',
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'WAREHOUSE_A',
        new Date().toISOString(),
      );

      mockRepository.findByTrackingId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(checkpointData)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.save.mockRejectedValue(new Error('Database write failed'));

      const checkpointData = CheckpointData.create(
        trackingId,
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'WAREHOUSE_A',
        new Date().toISOString(),
      );

      await expect(useCase.execute(checkpointData)).rejects.toThrow(
        'Database write failed',
      );
    });

    it('should parse ISO timestamp string correctly', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);
      const isoTimestamp = '2025-01-12T10:30:00.000Z';

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          isoTimestamp,
        ),
      );

      const savedUnit = mockRepository.save.mock.calls[0]![0];
      const addedCheckpoint =
        savedUnit.checkpoints[savedUnit.checkpoints.length - 1];
      expect(addedCheckpoint).toBeDefined();
      expect(addedCheckpoint!.timestamp).toBeInstanceOf(Date);
      expect(addedCheckpoint!.timestamp.toISOString()).toBe(isoTimestamp);
    });

    it('should handle different timestamp formats', async () => {
      const trackingId = 'T-ABC-12345';
      let currentUnit = Unit.create(trackingId);

      mockRepository.findByTrackingId.mockImplementation(() =>
        Promise.resolve(currentUnit),
      );
      mockRepository.save.mockImplementation((unit: Unit) => {
        currentUnit = unit;
        return Promise.resolve(unit);
      });

      const timestamps = [
        '2025-01-12T10:30:00.000Z',
        '2025-01-12T10:31:00Z',
        '2025-01-12T10:32:00',
      ];

      const states = [
        UNIT_STATE_ENUMERATION.PICKED_UP,
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      ];

      for (let i = 0; i < timestamps.length; i++) {
        await useCase.execute(
          CheckpointData.create(
            trackingId,
            states[i]!,
            'WAREHOUSE_A',
            timestamps[i]!,
          ),
        );
      }

      expect(mockRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should handle complete delivery flow', async () => {
      const trackingId = 'T-FLOW-12345';
      let currentUnit: Unit | null = null;

      mockRepository.findByTrackingId.mockImplementation(() =>
        Promise.resolve(currentUnit),
      );
      mockRepository.save.mockImplementation((unit: Unit) => {
        currentUnit = unit;
        return Promise.resolve(unit);
      });

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date('2025-01-12T09:00:00Z').toISOString(),
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.PICKED_UP,
      );

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK_A123',
          new Date('2025-01-12T10:00:00Z').toISOString(),
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
      );

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN_B456',
          new Date('2025-01-12T11:00:00Z').toISOString(),
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      );

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.DELIVERED,
          'CUSTOMER_ADDRESS',
          new Date('2025-01-12T12:00:00Z').toISOString(),
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.DELIVERED,
      );
      expect((currentUnit as unknown as Unit).checkpoints).toHaveLength(5);
    });

    it('should handle failed delivery with return flow', async () => {
      const trackingId = 'T-RETURN-12345';
      let currentUnit: Unit | null = null;

      mockRepository.findByTrackingId.mockImplementation(() =>
        Promise.resolve(currentUnit),
      );
      mockRepository.save.mockImplementation((unit: Unit) => {
        currentUnit = unit;
        return Promise.resolve(unit);
      });

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE',
          new Date().toISOString(),
        ),
      );
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK',
          new Date().toISOString(),
        ),
      );

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
          'CUSTOMER_ADDRESS',
          new Date().toISOString(),
          'Customer not available',
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
      );

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.RETURNED,
          'WAREHOUSE',
          new Date().toISOString(),
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.RETURNED,
      );
      expect((currentUnit as unknown as Unit).checkpoints).toHaveLength(5);
    });
  });
});
