import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { CoreModule } from './core/core.module';
import { LoggerModule } from './core/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/presentation/guards/jwt-auth.guard';
import { TrackingModule } from './modules/tracking/tracking.module';
import { AppController, AdminController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('postgres.url'),
        ssl:
          configService.get<string>('nodeEnv') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('postgres.synchronize'),
        logging: configService.get<boolean>('postgres.logging'),
      }),
    }),
    CoreModule,
    LoggerModule,
    AuthModule,
    TrackingModule,
  ],
  controllers: [AppController, AdminController],
  providers: [
    AppService,
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
