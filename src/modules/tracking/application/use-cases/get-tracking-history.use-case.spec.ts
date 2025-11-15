import { UnitResponseOutput } from '../dtos/output/unit-response.output';
import { GetTrackingHistoryUseCase } from './get-tracking-history.use-case';

import { Checkpoint } from '../../domain/checkpoint.entity';
import { Unit } from '../../domain/unit.entity';
import { UNIT_STATE_ENUMERATION } from '../../domain/unit-state.enumeration';
import { UnitNotFoundError } from '../../domain/unit.errors';
import { IUnitRepository } from '../../domain/unit.repository';

describe('GetTrackingHistoryUseCase', () => {
  let useCase: GetTrackingHistoryUseCase;
  let mockRepository: jest.Mocked<IUnitRepository>;

  beforeEach(() => {
    mockRepository = {
      findByTrackingId: jest.fn(),
      save: jest.fn(),
      findByState: jest.fn(),
    } as jest.Mocked<IUnitRepository>;

    // Plain class instantiation - no NestJS DI needed
    useCase = new GetTrackingHistoryUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return unit DTO when tracking ID exists', async () => {
      const trackingId = 'T-ABC-12345';
      const unit = Unit.create(trackingId);

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(trackingId);
      expect(mockRepository.findByTrackingId).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(UnitResponseOutput);
      expect(result.trackingId).toBe(trackingId);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
    });

    it('should return unit DTO with complete checkpoint history', async () => {
      const trackingId = 'T-ABC-12345';
      const unit = Unit.create(trackingId);

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
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN_B456',
          new Date('2025-01-12T12:00:00Z'),
        ),
      );

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(result).toBeInstanceOf(UnitResponseOutput);
      expect(result.checkpoints).toHaveLength(4);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY);
      expect(result.checkpoints[0]!.status).toBe(
        UNIT_STATE_ENUMERATION.CREATED,
      );
      expect(result.checkpoints[0]!.timestamp).toBeDefined();
      expect(typeof result.checkpoints[0]!.timestamp).toBe('string');
      expect(result.checkpoints[1]!.status).toBe(
        UNIT_STATE_ENUMERATION.PICKED_UP,
      );
      expect(result.checkpoints[2]!.status).toBe(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
      );
      expect(result.checkpoints[3]!.status).toBe(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      );
    });

    it('should return unit DTO with only initial CREATED checkpoint', async () => {
      const trackingId = 'T-NEW-99999';
      const unit = Unit.create(trackingId);

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(result).toBeInstanceOf(UnitResponseOutput);
      expect(result.checkpoints).toHaveLength(1);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      expect(result.checkpoints[0]!.status).toBe(
        UNIT_STATE_ENUMERATION.CREATED,
      );
    });

    it('should handle units with FAILED_DELIVERY retry flow', async () => {
      const trackingId = 'T-RETRY-222';
      const unit = Unit.create(trackingId);

      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
          'CUSTOMER',
          new Date(),
          'First attempt failed',
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK',
          new Date(),
          'Second attempt',
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN',
          new Date(),
        ),
      );

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(result).toBeInstanceOf(UnitResponseOutput);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY);
      expect(result.checkpoints).toHaveLength(6);
    });

    it('should throw UnitNotFoundError when tracking ID does not exist', async () => {
      const trackingId = 'T-XXX-99999';

      mockRepository.findByTrackingId.mockResolvedValue(null);

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        UnitNotFoundError,
      );
      await expect(useCase.execute(trackingId)).rejects.toThrow(
        `Unit with tracking ID ${trackingId} not found`,
      );
    });

    it('should handle repository errors', async () => {
      const trackingId = 'T-ERR-333';

      mockRepository.findByTrackingId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle unit with many checkpoints', async () => {
      const trackingId = 'T-MANY-666';
      const unit = Unit.create(trackingId);

      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.PICKED_UP,
          'WAREHOUSE',
          new Date(),
        ),
      );

      for (let i = 0; i < 5; i++) {
        unit.addCheckpoint(
          Checkpoint.create(
            UNIT_STATE_ENUMERATION.IN_TRANSIT,
            `TRUCK_${i}`,
            new Date(),
          ),
        );
        unit.addCheckpoint(
          Checkpoint.create(
            UNIT_STATE_ENUMERATION.FAILED_DELIVERY,
            `CUSTOMER_${i}`,
            new Date(),
            `Attempt ${i + 1} failed`,
          ),
        );
      }

      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.IN_TRANSIT,
          'TRUCK_FINAL',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          'VAN_FINAL',
          new Date(),
        ),
      );
      unit.addCheckpoint(
        Checkpoint.create(
          UNIT_STATE_ENUMERATION.DELIVERED,
          'CUSTOMER',
          new Date(),
        ),
      );

      mockRepository.findByTrackingId.mockResolvedValue(unit);

      const result = await useCase.execute(trackingId);

      expect(result).toBeInstanceOf(UnitResponseOutput);
      expect(result.checkpoints.length).toBe(15);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.DELIVERED);
    });
  });
});
