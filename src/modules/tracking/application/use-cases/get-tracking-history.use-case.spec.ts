import { GetTrackingHistoryUseCase } from './get-tracking-history.use-case';

import {
  Checkpoint,
  Unit,
  TrackingId,
  UnitNotFoundError,
  IUnitRepository,
} from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

describe('GetTrackingHistoryUseCase', () => {
  let useCase: GetTrackingHistoryUseCase;
  let mockRepository: jest.Mocked<IUnitRepository>;

  beforeEach(() => {
    mockRepository = {
      findByTrackingId: jest.fn(),
      findByState: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<IUnitRepository>;

    useCase = new GetTrackingHistoryUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return unit entity when tracking ID exists', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);
      const unit = Unit.create(trackingIdStr);

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(
        trackingIdStr,
      );
      expect(mockRepository.findByTrackingId).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Unit);
      expect(result.trackingId).toBe(trackingIdStr);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
    });

    it('should return unit entity with complete checkpoint history', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);
      const unit = Unit.create(trackingIdStr);

      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE_A',
          new Date('2025-01-12T10:00:00Z'),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK_A123',
          new Date('2025-01-12T11:00:00Z'),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.AT_FACILITY,
          'DISTRIBUTION_CENTER',
          new Date('2025-01-12T12:00:00Z'),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN_B456',
          new Date('2025-01-12T13:00:00Z'),
        ),
      );

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(result).toBeInstanceOf(Unit);
      expect(result.checkpoints).toHaveLength(5);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY);
      expect(result.checkpoints[0]!.status).toBe(
        UNIT_STATE_ENUMERATION.CREATED,
      );
      expect(result.checkpoints[0]!.timestamp).toBeDefined();
      expect(result.checkpoints[0]!.timestamp).toBeInstanceOf(Date);
      expect(result.checkpoints[1]!.status).toBe(
        UNIT_STATE_ENUMERATION.PICKED_UP,
      );
      expect(result.checkpoints[2]!.status).toBe(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
      );
      expect(result.checkpoints[3]!.status).toBe(
        UNIT_STATE_ENUMERATION.AT_FACILITY,
      );
      expect(result.checkpoints[4]!.status).toBe(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      );
    });

    it('should return unit entity with only initial CREATED checkpoint', async () => {
      const trackingIdStr = 'TRK-99999';
      const trackingId = TrackingId.create(trackingIdStr);
      const unit = Unit.create(trackingIdStr);

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(result).toBeInstanceOf(Unit);
      expect(result.checkpoints).toHaveLength(1);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      expect(result.checkpoints[0]!.status).toBe(
        UNIT_STATE_ENUMERATION.CREATED,
      );
    });

    it('should handle units with FAILED_DELIVERY retry flow', async () => {
      const trackingIdStr = 'TRK-00222';
      const trackingId = TrackingId.create(trackingIdStr);
      const unit = Unit.create(trackingIdStr);

      // CREATED → PICKED_UP
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE',
          new Date(),
        ),
      );
      // PICKED_UP → IN_TRANSIT
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK',
          new Date(),
        ),
      );
      // IN_TRANSIT → AT_FACILITY
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.AT_FACILITY,
          'DISTRIBUTION_CENTER',
          new Date(),
        ),
      );
      // AT_FACILITY → OUT_FOR_DELIVERY
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN',
          new Date(),
        ),
      );
      // OUT_FOR_DELIVERY → OUT_FOR_DELIVERY_EXCEPTION
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION,
          'CUSTOMER',
          new Date(),
          1,
          'First attempt failed',
        ),
      );
      // OUT_FOR_DELIVERY_EXCEPTION → OUT_FOR_DELIVERY (retry)
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN',
          new Date(),
          2,
          'Second attempt',
        ),
      );

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(result).toBeInstanceOf(Unit);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY);
      expect(result.checkpoints).toHaveLength(7);
    });

    it('should throw UnitNotFoundError when tracking ID does not exist', async () => {
      const trackingIdStr = 'TRK-99999';
      const trackingId = TrackingId.create(trackingIdStr);

      mockRepository.findByTrackingId.mockResolvedValue(null);

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        UnitNotFoundError,
      );
      await expect(useCase.execute(trackingId)).rejects.toThrow(
        `Unit with tracking ID ${trackingIdStr} not found`,
      );
    });

    it('should handle repository errors', async () => {
      const trackingIdStr = 'TRK-00333';
      const trackingId = TrackingId.create(trackingIdStr);

      mockRepository.findByTrackingId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle unit with many checkpoints', async () => {
      const trackingIdStr = 'TRK-00666';
      const trackingId = TrackingId.create(trackingIdStr);
      const unit = Unit.create(trackingIdStr);

      // CREATED → PICKED_UP
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE',
          new Date(),
        ),
      );
      // PICKED_UP → IN_TRANSIT
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK',
          new Date(),
        ),
      );
      // IN_TRANSIT → AT_FACILITY
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.AT_FACILITY,
          'DISTRIBUTION_CENTER',
          new Date(),
        ),
      );

      // Multiple delivery attempts with exceptions
      for (let i = 0; i < 3; i++) {
        // AT_FACILITY/OUT_FOR_DELIVERY_EXCEPTION → OUT_FOR_DELIVERY
        unit.addCheckpoint(
          Checkpoint.create(
            UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
            `VAN_${i}`,
            new Date(),
            i + 1,
          ),
        );
        // OUT_FOR_DELIVERY → OUT_FOR_DELIVERY_EXCEPTION
        unit.addCheckpoint(
          Checkpoint.create(
            UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION,
            `CUSTOMER_${i}`,
            new Date(),
            i + 1,
            `Attempt ${i + 1} failed`,
          ),
        );
      }

      // Final successful delivery
      // OUT_FOR_DELIVERY_EXCEPTION → OUT_FOR_DELIVERY
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN_FINAL',
          new Date(),
          4,
        ),
      );
      // OUT_FOR_DELIVERY → DELIVERED
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.DELIVERED,
          'CUSTOMER',
          new Date(),
        ),
      );

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(result).toBeInstanceOf(Unit);
      expect(result.checkpoints.length).toBe(12);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.DELIVERED);
    });
  });
});
