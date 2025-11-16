// Framework imports
import { Provider } from '@nestjs/common';

// Application layer
import {
  GetTrackingHistoryUseCase,
  ListUnitsByStateUseCase,
  RegisterCheckpointUseCase,
} from '../../application/use-cases';

// Domain layer
import {
  IUnitRepository,
  GET_TRACKING_HISTORY_USE_CASE_TOKEN,
  LIST_UNITS_BY_STATE_USE_CASE_TOKEN,
  REGISTER_CHECKPOINT_USE_CASE_TOKEN,
  UNIT_REPOSITORY_TOKEN_CONSTANT,
} from '../../domain';

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
