// Application layer
import { CreateUnitUseCase } from './create-unit.use-case';

// Domain layer
import {
  Unit,
  TrackingId,
  UnitAlreadyExistsError,
  IUnitRepository,
} from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

describe('CreateUnitUseCase', () => {
  let useCase: CreateUnitUseCase;
  let mockRepository: jest.Mocked<IUnitRepository>;

  beforeEach(() => {
    mockRepository = {
      findByTrackingId: jest.fn(),
      save: jest.fn(),
      findByState: jest.fn(),
    } as jest.Mocked<IUnitRepository>;

    // Plain class instantiation - no NestJS DI needed
    useCase = new CreateUnitUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a new unit with CREATED state', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      const result = await useCase.execute(trackingId);

      expect(mockRepository.findByTrackingId).toHaveBeenCalledWith(
        trackingIdStr,
      );
      expect(mockRepository.findByTrackingId).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      expect(result).toBeInstanceOf(Unit);
      expect(result.trackingId).toBe(trackingIdStr);
      expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
    });

    it('should create unit with initial CREATED checkpoint', async () => {
      const trackingIdStr = 'TRK-99999';
      const trackingId = TrackingId.create(trackingIdStr);

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

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

    it('should throw UnitAlreadyExistsError when unit already exists', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);
      const existingUnit = Unit.create(trackingIdStr);

      mockRepository.findByTrackingId.mockResolvedValue(existingUnit);

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        UnitAlreadyExistsError,
      );
      await expect(useCase.execute(trackingId)).rejects.toThrow(
        `Unit with tracking ID ${trackingIdStr} already exists`,
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle multiple units with different tracking IDs', async () => {
      const trackingIds = ['TRK-001', 'TRK-002', 'TRK-003'];

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      for (const trackingIdStr of trackingIds) {
        const trackingId = TrackingId.create(trackingIdStr);
        const result = await useCase.execute(trackingId);

        expect(result.trackingId).toBe(trackingIdStr);
        expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      }

      expect(mockRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should handle repository findByTrackingId errors', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockRepository.findByTrackingId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(new Error('Database write failed'));

      await expect(useCase.execute(trackingId)).rejects.toThrow(
        'Database write failed',
      );
    });

    it('should create unit with valid tracking ID format', async () => {
      const validTrackingIds = ['TRK-1', 'TRK-123', 'TRK-999999', 'TRK-0001'];

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      for (const trackingIdStr of validTrackingIds) {
        const trackingId = TrackingId.create(trackingIdStr);
        const result = await useCase.execute(trackingId);

        expect(result.trackingId).toBe(trackingIdStr);
        expect(result.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      }

      expect(mockRepository.save).toHaveBeenCalledTimes(
        validTrackingIds.length,
      );
    });

    it('should save unit with correct timestamp', async () => {
      const trackingIdStr = 'TRK-12345';
      const trackingId = TrackingId.create(trackingIdStr);
      const beforeCreation = new Date();

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

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

      mockRepository.findByTrackingId.mockResolvedValue(null);
      mockRepository.save.mockImplementation((unit) => Promise.resolve(unit));

      await useCase.execute(trackingId);

      const savedUnit = mockRepository.save.mock.calls[0]![0];
      expect(savedUnit).toBeInstanceOf(Unit);
      expect(savedUnit.trackingId).toBe(trackingIdStr);
      expect(savedUnit.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      expect(savedUnit.checkpoints).toHaveLength(1);
    });
  });
});
