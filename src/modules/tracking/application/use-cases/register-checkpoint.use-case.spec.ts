import { RegisterCheckpointUseCase } from './register-checkpoint.use-case';

import {
  Unit,
  CheckpointData,
  InvalidStateTransitionError,
  UnitNotFoundError,
  IUnitRepository,
  IUnitCachePort,
} from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

describe('register checkpoint use case', () => {
  let useCase: RegisterCheckpointUseCase;
  let mockRepository: jest.Mocked<IUnitRepository>;
  let mockCachePort: jest.Mocked<IUnitCachePort>;

  beforeEach(() => {
    mockRepository = {
      findByTrackingId: jest.fn(),
      findByState: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<IUnitRepository>;

    mockCachePort = {
      invalidateUnit: jest.fn(),
      getUnit: jest.fn(),
      setUnit: jest.fn(),
      getUnitExists: jest.fn(),
      setUnitExists: jest.fn(),
      clearAll: jest.fn(),
    } as jest.Mocked<IUnitCachePort>;

    // Plain class instantiation - no NestJS DI needed
    useCase = new RegisterCheckpointUseCase(mockRepository, mockCachePort);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw UnitNotFoundError when tracking ID does not exist', async () => {
      const checkpointData = CheckpointData.create(
        'TRK-12345',
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'ORIGIN_WAREHOUSE',
        new Date().toISOString(),
      );

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);

      await expect(useCase.execute(checkpointData)).rejects.toThrow(
        UnitNotFoundError,
      );

      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(
        checkpointData.trackingId,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockCachePort.setUnitExists).toHaveBeenCalledWith(
        checkpointData.trackingId,
        false,
      );
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

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.update.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(checkpointData);

      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(trackingId);
      expect(mockRepository.update).toHaveBeenCalledTimes(1);

      const savedUnit = mockRepository.update.mock.calls[0]![0];
      expect(savedUnit.currentState).toBe(UNIT_STATE_ENUMERATION.PICKED_UP);
      expect(savedUnit.checkpoints).toHaveLength(2);
    });

    it('should update unit through multiple valid transitions', async () => {
      const trackingId = 'T-ABC-12345';
      let currentUnit = Unit.create(trackingId);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(currentUnit);
      mockRepository.update.mockImplementation((unit) => {
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

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.update.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date().toISOString(),
          notes,
        ),
      );

      const savedUnit = mockRepository.update.mock.calls[0]![0];
      const addedCheckpoint =
        savedUnit.checkpoints[savedUnit.checkpoints.length - 1];
      expect(addedCheckpoint).toBeDefined();
      expect(addedCheckpoint!.notes).toBe(notes);
    });

    it('should throw InvalidStateTransitionError for invalid transition', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);

      mockCachePort.getUnitExists.mockResolvedValue(null);
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

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should handle repository findByTrackingId errors', async () => {
      const checkpointData = CheckpointData.create(
        'T-ABC-12345',
        UNIT_STATE_ENUMERATION.PICKED_UP,
        'WAREHOUSE_A',
        new Date().toISOString(),
      );

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(checkpointData)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.update.mockRejectedValue(
        new Error('Database write failed'),
      );

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

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.update.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          isoTimestamp,
        ),
      );

      const savedUnit = mockRepository.update.mock.calls[0]![0];
      const addedCheckpoint =
        savedUnit.checkpoints[savedUnit.checkpoints.length - 1];
      expect(addedCheckpoint).toBeDefined();
      expect(addedCheckpoint!.timestamp).toBeInstanceOf(Date);
      expect(addedCheckpoint!.timestamp.toISOString()).toBe(isoTimestamp);
    });

    it('should handle different timestamp formats', async () => {
      const trackingId = 'T-ABC-12345';
      let currentUnit = Unit.create(trackingId);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockImplementation(() =>
        Promise.resolve(currentUnit),
      );
      mockRepository.update.mockImplementation((unit: Unit) => {
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
        UNIT_STATE_ENUMERATION.AT_FACILITY,
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

      expect(mockRepository.update).toHaveBeenCalledTimes(3);
    });

    it('should handle complete delivery flow', async () => {
      const trackingId = 'T-FLOW-12345';
      let currentUnit = Unit.create(trackingId);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockImplementation(() =>
        Promise.resolve(currentUnit),
      );
      mockRepository.update.mockImplementation((unit: Unit) => {
        currentUnit = unit;
        return Promise.resolve(unit);
      });

      // CREATED → PICKED_UP
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

      // PICKED_UP → IN_TRANSIT
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

      // IN_TRANSIT → AT_FACILITY
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.AT_FACILITY,
          'DISTRIBUTION_CENTER',
          new Date('2025-01-12T11:00:00Z').toISOString(),
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.AT_FACILITY,
      );

      // AT_FACILITY → OUT_FOR_DELIVERY
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN_B456',
          new Date('2025-01-12T12:00:00Z').toISOString(),
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      );

      // OUT_FOR_DELIVERY → DELIVERED
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.DELIVERED,
          'CUSTOMER_ADDRESS',
          new Date('2025-01-12T13:00:00Z').toISOString(),
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.DELIVERED,
      );
      expect((currentUnit as unknown as Unit).checkpoints).toHaveLength(6);
    });

    it('should handle failed delivery with return flow', async () => {
      const trackingId = 'T-RETURN-12345';
      let currentUnit = Unit.create(trackingId);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockImplementation(() =>
        Promise.resolve(currentUnit),
      );
      mockRepository.update.mockImplementation((unit: Unit) => {
        currentUnit = unit;
        return Promise.resolve(unit);
      });

      // CREATED → PICKED_UP
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE',
          new Date().toISOString(),
        ),
      );

      // PICKED_UP → IN_TRANSIT
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK',
          new Date().toISOString(),
        ),
      );

      // IN_TRANSIT → AT_FACILITY
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.AT_FACILITY,
          'DISTRIBUTION_CENTER',
          new Date().toISOString(),
        ),
      );

      // AT_FACILITY → OUT_FOR_DELIVERY
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN',
          new Date().toISOString(),
        ),
      );

      // OUT_FOR_DELIVERY → OUT_FOR_DELIVERY_EXCEPTION (delivery failed)
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION,
          'CUSTOMER_ADDRESS',
          new Date().toISOString(),
          'Customer not available',
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION,
      );

      // OUT_FOR_DELIVERY_EXCEPTION → OUT_FOR_DELIVERY (retry delivery)
      await useCase.execute(
        CheckpointData.create(
          trackingId,
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN',
          new Date().toISOString(),
          'Second attempt',
        ),
      );
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      );
      expect((currentUnit as unknown as Unit).checkpoints).toHaveLength(7);
    });
  });
});
