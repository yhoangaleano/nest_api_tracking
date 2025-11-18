import { Global, Module } from '@nestjs/common';

import { CACHE_SERVICE_TOKEN_CONSTANT, RedisCacheService } from './cache';
import { HEALTH_SERVICE_TOKEN_CONSTANT, HealthService } from './health';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_SERVICE_TOKEN_CONSTANT,
      useClass: RedisCacheService,
    },
    {
      provide: HEALTH_SERVICE_TOKEN_CONSTANT,
      useClass: HealthService,
    },
  ],
  exports: [CACHE_SERVICE_TOKEN_CONSTANT, HEALTH_SERVICE_TOKEN_CONSTANT],
})
export class CoreModule {}
