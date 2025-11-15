// Framework imports
import { Provider } from '@nestjs/common';

// Application layer
import { GetTrackingHistoryUseCase } from '../../application/use-cases/get-tracking-history.use-case';
import { ListUnitsByStateUseCase } from '../../application/use-cases/list-units-by-state.use-case';
import { RegisterCheckpointUseCase } from '../../application/use-cases/register-checkpoint.use-case';
import {
  GET_TRACKING_HISTORY_USE_CASE_TOKEN,
  LIST_UNITS_BY_STATE_USE_CASE_TOKEN,
  REGISTER_CHECKPOINT_USE_CASE_TOKEN,
} from '../../application/use-cases/interfaces';

// Domain layer
import {
  IUnitRepository,
  UNIT_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain/unit.repository';

export const USE_CASE_PROVIDERS: Provider[] = [
  {
    provide: GET_TRACKING_HISTORY_USE_CASE_TOKEN,
    useFactory: (unitRepository: IUnitRepository) => {
      return new GetTrackingHistoryUseCase(unitRepository);
    },
    inject: [UNIT_REPOSITORY_TOKEN_CONSTANT],
  },
  {
    provide: LIST_UNITS_BY_STATE_USE_CASE_TOKEN,
    useFactory: (unitRepository: IUnitRepository) => {
      return new ListUnitsByStateUseCase(unitRepository);
    },
    inject: [UNIT_REPOSITORY_TOKEN_CONSTANT],
  },
  {
    provide: REGISTER_CHECKPOINT_USE_CASE_TOKEN,
    useFactory: (unitRepository: IUnitRepository) => {
      return new RegisterCheckpointUseCase(unitRepository);
    },
    inject: [UNIT_REPOSITORY_TOKEN_CONSTANT],
  },
];
