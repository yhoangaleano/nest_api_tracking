import { ListUnitsByStateUseCase } from './list-units-by-state.use-case';

import { Unit, UnitStateQuery, IUnitRepository } from '../../domain';
import { UNIT_STATE_ENUMERATION } from '../../domain/configs';

describe('ListUnitsByStateUseCase', () => {
  let useCase: ListUnitsByStateUseCase;
  let mockRepository: jest.Mocked<IUnitRepository>;

  beforeEach(() => {
    mockRepository = {
      findByTrackingId: jest.fn(),
      findByState: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<IUnitRepository>;

    useCase = new ListUnitsByStateUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return units with CREATED state', async () => {
      const stateQuery = UnitStateQuery.create(UNIT_STATE_ENUMERATION.CREATED);
      const units = [
        Unit.create('TRK-001'),
        Unit.create('TRK-002'),
        Unit.create('TRK-003'),
      ];

      mockRepository.findByState.mockResolvedValue(units);

      const result = await useCase.execute(stateQuery);

      expect(mockRepository.findByState).toHaveBeenCalledWith(
        UNIT_STATE_ENUMERATION.CREATED,
      );
      expect(mockRepository.findByState).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(result).toEqual(units);
      result.forEach((unit) => {
        expect(unit.currentState).toBe(UNIT_STATE_ENUMERATION.CREATED);
      });
    });

    it('should return units with PICKED_UP state', async () => {
      const stateQuery = UnitStateQuery.create(
        UNIT_STATE_ENUMERATION.PICKED_UP,
      );
      const units = [Unit.create('TRK-100'), Unit.create('TRK-101')];

      mockRepository.findByState.mockResolvedValue(units);

      const result = await useCase.execute(stateQuery);

      expect(mockRepository.findByState).toHaveBeenCalledWith(
        UNIT_STATE_ENUMERATION.PICKED_UP,
      );
      expect(result).toHaveLength(2);
    });

    it('should return units with IN_TRANSIT state', async () => {
      const stateQuery = UnitStateQuery.create(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
      );
      const units = [
        Unit.create('TRK-200'),
        Unit.create('TRK-201'),
        Unit.create('TRK-202'),
        Unit.create('TRK-203'),
      ];

      mockRepository.findByState.mockResolvedValue(units);

      const result = await useCase.execute(stateQuery);

      expect(mockRepository.findByState).toHaveBeenCalledWith(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
      );
      expect(result).toHaveLength(4);
    });

    it('should return units with DELIVERED state', async () => {
      const stateQuery = UnitStateQuery.create(
        UNIT_STATE_ENUMERATION.DELIVERED,
      );
      const units = [
        Unit.create('TRK-300'),
        Unit.create('TRK-301'),
        Unit.create('TRK-302'),
      ];

      mockRepository.findByState.mockResolvedValue(units);

      const result = await useCase.execute(stateQuery);

      expect(mockRepository.findByState).toHaveBeenCalledWith(
        UNIT_STATE_ENUMERATION.DELIVERED,
      );
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no units found for state', async () => {
      const stateQuery = UnitStateQuery.create(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      );

      mockRepository.findByState.mockResolvedValue([]);

      const result = await useCase.execute(stateQuery);

      expect(mockRepository.findByState).toHaveBeenCalledWith(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
      );
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle units with OUT_FOR_DELIVERY_EXCEPTION state', async () => {
      const stateQuery = UnitStateQuery.create(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION,
      );
      const units = [Unit.create('TRK-400')];

      mockRepository.findByState.mockResolvedValue(units);

      const result = await useCase.execute(stateQuery);

      expect(mockRepository.findByState).toHaveBeenCalledWith(
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION,
      );
      expect(result).toHaveLength(1);
    });

    it('should handle units with AT_FACILITY state', async () => {
      const stateQuery = UnitStateQuery.create(
        UNIT_STATE_ENUMERATION.AT_FACILITY,
      );
      const units = [Unit.create('TRK-500'), Unit.create('TRK-501')];

      mockRepository.findByState.mockResolvedValue(units);

      const result = await useCase.execute(stateQuery);

      expect(mockRepository.findByState).toHaveBeenCalledWith(
        UNIT_STATE_ENUMERATION.AT_FACILITY,
      );
      expect(result).toHaveLength(2);
    });

    it('should return Unit entities with correct structure', async () => {
      const stateQuery = UnitStateQuery.create(UNIT_STATE_ENUMERATION.CREATED);
      const units = [Unit.create('TRK-001')];

      mockRepository.findByState.mockResolvedValue(units);

      const result = await useCase.execute(stateQuery);

      expect(result[0]).toBeInstanceOf(Unit);
      expect(result[0]!.trackingId).toBeDefined();
      expect(result[0]!.currentState).toBeDefined();
      expect(result[0]!.checkpoints).toBeDefined();
      expect(Array.isArray(result[0]!.checkpoints)).toBe(true);
    });

    it('should handle repository errors', async () => {
      const stateQuery = UnitStateQuery.create(UNIT_STATE_ENUMERATION.CREATED);

      mockRepository.findByState.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(stateQuery)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle large number of units', async () => {
      const stateQuery = UnitStateQuery.create(UNIT_STATE_ENUMERATION.CREATED);
      const units = Array.from({ length: 1000 }, (_, i) =>
        Unit.create(`TRK-${i.toString().padStart(6, '0')}`),
      );

      mockRepository.findByState.mockResolvedValue(units);

      const result = await useCase.execute(stateQuery);

      expect(result).toHaveLength(1000);
      expect(mockRepository.findByState).toHaveBeenCalledTimes(1);
    });

    it('should query repository only once per execution', async () => {
      const stateQuery = UnitStateQuery.create(UNIT_STATE_ENUMERATION.CREATED);
      const units = [Unit.create('TRK-001')];

      mockRepository.findByState.mockResolvedValue(units);

      await useCase.execute(stateQuery);

      expect(mockRepository.findByState).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple sequential queries with different states', async () => {
      const states = [
        UNIT_STATE_ENUMERATION.CREATED,
        UNIT_STATE_ENUMERATION.PICKED_UP,
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
        UNIT_STATE_ENUMERATION.DELIVERED,
      ];

      for (const state of states) {
        const stateQuery = UnitStateQuery.create(state);
        const units = [Unit.create(`TRK-${state}`)];

        mockRepository.findByState.mockResolvedValue(units);

        const result = await useCase.execute(stateQuery);

        expect(mockRepository.findByState).toHaveBeenCalledWith(state);
        expect(result).toHaveLength(1);
      }

      expect(mockRepository.findByState).toHaveBeenCalledTimes(states.length);
    });

    it('should return units maintaining their checkpoint history', async () => {
      const stateQuery = UnitStateQuery.create(
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
      );
      const unit = Unit.create('TRK-001');
      // Unit already has CREATED checkpoint, this is the current state

      mockRepository.findByState.mockResolvedValue([unit]);

      const result = await useCase.execute(stateQuery);

      expect(result[0]!.checkpoints).toHaveLength(1);
      expect(result[0]!.checkpoints[0]!.status).toBe(
        UNIT_STATE_ENUMERATION.CREATED,
      );
    });
  });
});
