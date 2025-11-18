import { CreateUnitUseCase } from './create-unit.use-case';

import {
  Unit,
  TrackingId,
  UnitAlreadyExistsError,
  IUnitRepository,
  IUnitCachePort,
} from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

describe('CreateUnitUseCase', () => {
  let useCase: CreateUnitUseCase;
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
      getUnitExists: jest.fn(),
      setUnitExists: jest.fn(),
      invalidateUnit: jest.fn(),
      clearAll: jest.fn(),
    } as jest.Mocked<IUnitCachePort>;

    useCase = new CreateUnitUseCase(mockRepository, mockCachePort);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a new unit with CREATED state', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.create.mockImplementation((unit) => Promise.resolve(unit));

      const result = await useCase.execute(trackingId);

      expect(mockCachePort.getUnitExists).toHaveBeenCalledWith(trackingIdStr);
      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(
        trackingIdStr,
      );
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockCachePort.setUnitExists).toHaveBeenCalledWith(
        trackingIdStr,
        true,
      );
      expect(result).toBeInstanceOf(Unit);
      expect(result.trackingId).toBe(trackingIdStr);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
    });

    it('should create unit with initial CREATED checkpoint', async () => {
      const trackingIdStr = 'TRK-99999';
      const trackingId = TrackingId.create(trackingIdStr);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.create.mockImplementation((unit) => Promise.resolve(unit));

      const result = await useCase.execute(trackingId);

      expect(result.checkpoints).toHaveLength(1);
      expect(result.checkpoints[0]!.status).toBe(
        UNIT_STATE_ENUMERATION.CREATED,
      );
      expect(result.checkpoints[0]!.location).toBe('System');
      expect(result.checkpoints[0]!.notes).toBe(
        'Unit registered in the system',
      );
      expect(result.checkpoints[0]!.timestamp).toBeInstanceOf(Date);
    });

    it('should throw UnitAlreadyExistsError when unit exists in cache', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockCachePort.getUnitExists.mockResolvedValue('1');

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        UnitAlreadyExistsError,
      );
      await expect(useCase.execute(trackingId)).rejects.toThrow(
        `Unit with tracking ID ${trackingIdStr} already exists`,
      );

      expect(mockRepository.findByTrackingId).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw UnitAlreadyExistsError and update cache when unit exists in DB', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);
      const existingUnit = Unit.create(trackingIdStr);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        UnitAlreadyExistsError,
      );

      expect(mockCachePort.setUnitExists).toHaveBeenCalledWith(
        trackingIdStr,
        true,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate UnitAlreadyExistsError from repository', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.create.mockRejectedValue(
        new UnitAlreadyExistsError(trackingIdStr),
      );

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        UnitAlreadyExistsError,
      );
      await expect(useCase.execute(trackingId)).rejects.toThrow(
        `Unit with tracking ID ${trackingIdStr} already exists`,
      );
    });

    it('should handle multiple units with different tracking IDs', async () => {
      const trackingIds = ['TRK-001', 'TRK-002', 'TRK-003'];

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.create.mockImplementation((unit) => Promise.resolve(unit));

      for (const trackingIdStr of trackingIds) {
        const trackingId = TrackingId.create(trackingIdStr);
        const result = await useCase.execute(trackingId);

        expect(result.trackingId).toBe(trackingIdStr);
        expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      }

      expect(mockRepository.create).toHaveBeenCalledTimes(3);
      expect(mockCachePort.setUnitExists).toHaveBeenCalledTimes(3);
    });

    it('should handle repository create errors', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.create.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle cache errors gracefully', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockCachePort.getUnitExists.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        'Redis connection failed',
      );

      expect(mockRepository.findByTrackingId).not.toHaveBeenCalled();
    });

    it('should create unit with valid tracking ID format', async () => {
      const validTrackingIds = ['TRK-1', 'TRK-123', 'TRK-999999', 'TRK-0001'];

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.create.mockImplementation((unit) => Promise.resolve(unit));

      for (const trackingIdStr of validTrackingIds) {
        const trackingId = TrackingId.create(trackingIdStr);
        const result = await useCase.execute(trackingId);

        expect(result.trackingId).toBe(trackingIdStr);
        expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      }

      expect(mockRepository.create).toHaveBeenCalledTimes(
        validTrackingIds.length,
      );
    });

    it('should create unit with correct timestamp', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);
      const beforeCreation = new Date();

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.create.mockImplementation((unit) => Promise.resolve(unit));

      const result = await useCase.execute(trackingId);
      const afterCreation = new Date();

      const checkpoint = result.checkpoints[0];
      expect(checkpoint).toBeDefined();
      expect(checkpoint!.timestamp).toBeInstanceOf(Date);
      expect(checkpoint!.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(checkpoint!.timestamp.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime(),
      );
    });

    it('should verify repository receives correct unit entity', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockCachePort.getUnitExists.mockResolvedValue(null);
      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.create.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(trackingId);

      const createdUnit = mockRepository.create.mock.calls[0]![0];
      expect(createdUnit).toBeInstanceOf(Unit);
      expect(createdUnit.trackingId).toBe(trackingIdStr);
      expect(createdUnit.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      expect(createdUnit.checkpoints).toHaveLength(1);
    });
  });
});
