// Framework imports
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Own code imports
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { LoggerModule } from './core/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/presentation/guards/jwt-auth.guard';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),

    // Database
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.url'),
      }),
    }),

    // Core Modules
    LoggerModule,

    // Feature Modules
    AuthModule,
    TrackingModule,
  ],
  controllers: [],
  providers: [
    // Only enable JWT guard if DISABLE_AUTH is not 'true'
    // This allows E2E tests to run without authentication
    ...(process.env.DISABLE_AUTH === 'true'
      ? []
      : [
          {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
          },
        ]),
  ],
})
export class AppModule {}
