import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { RegisterCheckpointDto } from './dtos/register-checkpoint.dto';
import { ListUnitsQueryDto } from './dtos/list-units-query.dto';
import { UNIT_STATE_ENUMERATION } from '../domain/configs/unit-state.enum'; // Corrected path
import { UnitNotFoundError } from '../domain/exceptions/unit.errors'; // Corrected path
import {
  GET_TRACKING_HISTORY_USE_CASE_TOKEN,
  LIST_UNITS_BY_STATE_USE_CASE_TOKEN,
  IGetTrackingHistoryUseCase,
  IListUnitsByStateUseCase,
} from '../domain/ports/use-cases'; // Corrected path
import {
  ICheckpointProducer,
  CHECKPOINT_PRODUCER_TOKEN,
} from '../domain/ports/messaging'; // Corrected path
import { LoggerService } from '../../../core/logger/logger.service';

describe('TrackingController', () => {
  let controller: TrackingController;
  let mockCheckpointProducer: jest.Mocked<ICheckpointProducer>;
  let mockGetTrackingHistoryUseCase: jest.Mocked<IGetTrackingHistoryUseCase>;
  let mockListUnitsByStateUseCase: jest.Mocked<IListUnitsByStateUseCase>;

  beforeEach(async () => {
    mockCheckpointProducer = {
      publish: jest.fn(),
    };

    mockGetTrackingHistoryUseCase = {
      execute: jest.fn(),
    };

    mockListUnitsByStateUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrackingController],
      providers: [
        {
          provide: CHECKPOINT_PRODUCER_TOKEN,
          useValue: mockCheckpointProducer,
        },
        {
          provide: GET_TRACKING_HISTORY_USE_CASE_TOKEN,
          useValue: mockGetTrackingHistoryUseCase,
        },
        {
          provide: LIST_UNITS_BY_STATE_USE_CASE_TOKEN,
          useValue: mockListUnitsByStateUseCase,
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            logWithMetadata: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TrackingController>(TrackingController);
  });

  describe('POST /checkpoints', () => {
    it('should register checkpoint successfully and return accepted message', () => {
      const dto: RegisterCheckpointDto = {
        trackingId: 'TRK-12345',
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: new Date().toISOString(),
      };

      const result = controller.registerCheckpoint(dto);

      expect(mockCheckpointProducer.publish).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Checkpoint received and queued for processing.',
      });
    });
  });

  describe('GET /tracking/:trackingId', () => {
    it('should return tracking history for existing unit', async () => {
      const trackingId = 'TRK-12345';
      const mockUnit = {
        id: 'some-id',
        trackingId: trackingId,
        currentState: UNIT_STATE_ENUMERATION.IN_TRANSIT,
        checkpoints: [
          {
            status: UNIT_STATE_ENUMERATION.CREATED,
            location: 'ORIGIN',
            timestamp: new Date(),
            notes: 'created',
          },
          {
            status: UNIT_STATE_ENUMERATION.PICKED_UP,
            location: 'WAREHOUSE',
            timestamp: new Date(),
            notes: 'picked up',
          },
        ],
      };

      mockGetTrackingHistoryUseCase.execute.mockResolvedValue(mockUnit as any);

      const result = await controller.getTrackingHistory(trackingId);

      expect(mockGetTrackingHistoryUseCase.execute).toHaveBeenCalled();
      expect(result.trackingId).toBe(trackingId);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.IN_TRANSIT);
      expect(result.checkpoints).toHaveLength(2);
    });

    it('should throw NotFoundException for non-existing tracking ID', async () => {
      const trackingId = 'TRK-99999';

      mockGetTrackingHistoryUseCase.execute.mockRejectedValue(
        new UnitNotFoundError(trackingId),
      );

      await expect(controller.getTrackingHistory(trackingId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockGetTrackingHistoryUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('GET /shipments', () => {
    it('should return list of units by status', async () => {
      const query: ListUnitsQueryDto = {
        status: UNIT_STATE_ENUMERATION.IN_TRANSIT,
      };

      const mockUnits = [
        {
          id: 'id1',
          trackingId: { value: 'TRK-12345' },
          currentState: UNIT_STATE_ENUMERATION.IN_TRANSIT,
        },
        {
          id: 'id2',
          trackingId: { value: 'T-DEF-67890' },
          currentState: UNIT_STATE_ENUMERATION.IN_TRANSIT,
        },
      ];

      mockListUnitsByStateUseCase.execute.mockResolvedValue(mockUnits as any);

      const result = await controller.listShipmentsByState(query);

      expect(mockListUnitsByStateUseCase.execute).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]!.currentState).toBe(UNIT_STATE_ENUMERATION.IN_TRANSIT);
    });

    it('should return empty array when no units match', async () => {
      const query: ListUnitsQueryDto = {
        status: UNIT_STATE_ENUMERATION.DELIVERED,
      };

      mockListUnitsByStateUseCase.execute.mockResolvedValue([]);

      const result = await controller.listShipmentsByState(query);

      expect(mockListUnitsByStateUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
