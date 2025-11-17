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
  REGISTER_CHECKPOINT_USE_CASE_TOKEN,
  IGetTrackingHistoryUseCase,
  IListUnitsByStateUseCase,
  IRegisterCheckpointUseCase,
  CREATE_UNIT_USE_CASE_TOKEN,
  ICreateUnitUseCase,
  Unit,
} from '../domain'; // Corrected path
import { LoggerService } from '../../../core/logger/logger.service';

describe('TrackingController', () => {
  let controller: TrackingController;
  let mockRegisterCheckpointUseCase: jest.Mocked<IRegisterCheckpointUseCase>;
  let mockGetTrackingHistoryUseCase: jest.Mocked<IGetTrackingHistoryUseCase>;
  let mockListUnitsByStateUseCase: jest.Mocked<IListUnitsByStateUseCase>;
  let mockCreateUnitUseCase: jest.Mocked<ICreateUnitUseCase>;

  beforeEach(async () => {
    mockRegisterCheckpointUseCase = {
      execute: jest.fn(),
    } as jest.Mocked<IRegisterCheckpointUseCase>;

    mockGetTrackingHistoryUseCase = {
      execute: jest.fn(),
    } as jest.Mocked<IGetTrackingHistoryUseCase>;

    mockListUnitsByStateUseCase = {
      execute: jest.fn(),
    } as jest.Mocked<IListUnitsByStateUseCase>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    mockCreateUnitUseCase = {
      execute: jest.fn(),
    } as jest.Mocked<ICreateUnitUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrackingController],
      providers: [
        {
          provide: REGISTER_CHECKPOINT_USE_CASE_TOKEN,
          useValue: mockRegisterCheckpointUseCase,
        },

        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          provide: CREATE_UNIT_USE_CASE_TOKEN,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: mockCreateUnitUseCase,
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
    it('should register checkpoint successfully and return success message', async () => {
      const dto: RegisterCheckpointDto = {
        trackingId: 'TRK-12345',
        status: UNIT_STATE_ENUMERATION.PICKED_UP,
        location: 'WAREHOUSE_A',
        timestamp: new Date().toISOString(),
      };

      mockRegisterCheckpointUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.registerCheckpoint(dto);

      expect(mockRegisterCheckpointUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Checkpoint registered successfully',
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
            timestamp: new Date(),
            location: 'ORIGIN',
            attemptNumber: 1,
            notes: 'created',
          },
          {
            status: UNIT_STATE_ENUMERATION.PICKED_UP,
            timestamp: new Date(),
            location: 'WAREHOUSE',
            attemptNumber: 1,
            notes: 'picked up',
          },
        ],
        addCheckpoint: jest.fn(),
      } as unknown as Unit;

      mockGetTrackingHistoryUseCase.execute.mockResolvedValue(mockUnit);

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
          trackingId: 'TRK-12345',
          currentState: UNIT_STATE_ENUMERATION.IN_TRANSIT,
          checkpoints: [],
          addCheckpoint: jest.fn(),
        },
        {
          id: 'id2',
          trackingId: 'T-DEF-67890',
          currentState: UNIT_STATE_ENUMERATION.IN_TRANSIT,
          checkpoints: [],
          addCheckpoint: jest.fn(),
        },
      ] as unknown as Unit[];

      mockListUnitsByStateUseCase.execute.mockResolvedValue(mockUnits);

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
