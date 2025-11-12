import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { DomainExceptionFilter } from './core/filters/domain-exception.filter';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { LoggerService } from './core/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Enable global exception filters (order matters: most specific first)
  app.useGlobalFilters(
    new AllExceptionsFilter(logger),
    new HttpExceptionFilter(logger),
    new DomainExceptionFilter(logger),
  );

  // Enable global validation with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = configService
    .get<string>('cors.allowedOrigins')
    ?.split(',') || ['http://localhost:3001'];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Tracking API')
    .setDescription('API de alta disponibilidad para tracking logístico')
    .setVersion('1.0')
    .addTag('tracking', 'Endpoints de tracking de paquetes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('port') || 3000;

  await app.listen(port);
  console.log(`[API] Server running on http://localhost:${port}`);
  console.log(`[API] Swagger docs available at http://localhost:${port}/api`);
}

void bootstrap();
