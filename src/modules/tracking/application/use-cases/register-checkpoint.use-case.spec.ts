import { RegisterCheckpointInput } from '../dtos/input/register-checkpoint.input';
import { RegisterCheckpointUseCase } from './register-checkpoint.use-case';

import {
  Unit,
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
      const input: RegisterCheckpointInput = {
        trackingId: 'T-NEW-12345',
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'ORIGIN_WAREHOUSE',
        timestamp: new Date().toISOString(),
      };

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(input);

      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(
        input.trackingId,
      );
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedUnit = mockRepository.save.mock.calls[0]![0];
      expect(savedUnit.trackingId).toBe(input.trackingId);
      expect(savedUnit.currentState).toBe(UNIT_STATE_ENUMERATION.PICKED_UP);
    });

    it('should add checkpoint to existing unit', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);

      const input: RegisterCheckpointInput = {
        trackingId,
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: new Date().toISOString(),
      };

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(input);

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

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: new Date().toISOString(),
      });

      expect(currentUnit.currentState).toBe(UNIT_STATE_ENUMERATION.PICKED_UP);

      mockRepository.findByTrackingId.mockResolvedValue(currentUnit);

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.IN_TRANSIT,
        location: 'TRUCK_A123',
        timestamp: new Date().toISOString(),
      });

      expect(currentUnit.currentState).toBe(UNIT_STATE_ENUMERATION.IN_TRANSIT);
      expect(currentUnit.checkpoints).toHaveLength(3);
    });

    it('should include notes when provided', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);
      const notes = 'Package handled with special care';

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: new Date().toISOString(),
        notes,
      });

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

      const input: RegisterCheckpointInput = {
        trackingId,
        status: UNIT_STATE_ENUMERATION.DELIVERED,
        location: 'CUSTOMER_ADDRESS',
        timestamp: new Date().toISOString(),
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        InvalidStateTransitionError,
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository findByTrackingId errors', async () => {
      const input: RegisterCheckpointInput = {
        trackingId: 'T-ABC-12345',
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: new Date().toISOString(),
      };

      mockRepository.findByTrackingId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(input)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.save.mockRejectedValue(new Error('Database write failed'));

      const input: RegisterCheckpointInput = {
        trackingId,
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: new Date().toISOString(),
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Database write failed',
      );
    });

    it('should parse ISO timestamp string correctly', async () => {
      const trackingId = 'T-ABC-12345';
      const existingUnit = Unit.create(trackingId);
      const isoTimestamp = '2025-01-12T10:30:00.000Z';

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: isoTimestamp,
      });

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
        await useCase.execute({
          trackingId,
          status: states[i]!,
          location: 'WAREHOUSE_A',
          timestamp: timestamps[i]!,
        });
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

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: new Date('2025-01-12T09:00:00Z').toISOString(),
      });
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.PICKED_UP,
      );

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.IN_TRANSIT,
        location: 'TRUCK_A123',
        timestamp: new Date('2025-01-12T10:00:00Z').toISOString(),
      });
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
      );

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
        location: 'VAN_B456',
        timestamp: new Date('2025-01-12T11:00:00Z').toISOString(),
      });
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      );

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.DELIVERED,
        location: 'CUSTOMER_ADDRESS',
        timestamp: new Date('2025-01-12T12:00:00Z').toISOString(),
      });
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

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE',
        timestamp: new Date().toISOString(),
      });
      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.IN_TRANSIT,
        location: 'TRUCK',
        timestamp: new Date().toISOString(),
      });

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
        location: 'CUSTOMER_ADDRESS',
        timestamp: new Date().toISOString(),
        notes: 'Customer not available',
      });
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
      );

      await useCase.execute({
        trackingId,
        status: UNIT_STATE_ENUMERATION.RETURNED,
        location: 'WAREHOUSE',
        timestamp: new Date().toISOString(),
      });
      expect((currentUnit as unknown as Unit).currentState).toBe(
        UNIT_STATE_ENUMERATION.RETURNED,
      );
      expect((currentUnit as unknown as Unit).checkpoints).toHaveLength(5);
    });
  });
});
