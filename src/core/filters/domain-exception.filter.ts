import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { LoggerService } from '../logger/logger.service';
import { DomainException } from '../../shared/domain/domain.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly statusCodeMap: Map<string, HttpStatus> = new Map([
    ['UnitNotFoundError', HttpStatus.NOT_FOUND],
    ['InvalidStateTransitionError', HttpStatus.CONFLICT],
    ['UserNotFoundError', HttpStatus.NOT_FOUND],
    ['UserAlreadyExistsError', HttpStatus.CONFLICT],
    ['InvalidCredentialsError', HttpStatus.UNAUTHORIZED],
    ['InactiveUserError', HttpStatus.FORBIDDEN],
  ]);

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('DomainExceptionFilter');
  }

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      this.statusCodeMap.get(exception.constructor.name) ||
      HttpStatus.BAD_REQUEST;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message,
      error: exception.name,
      code: exception.code,
    };

    this.logger.logWithMetadata(
      'warn',
      `Domain exception: ${exception.message}`,
      {
        code: exception.code,
        path: request.url,
        method: request.method,
      },
    );

    response.status(status).json(errorResponse);
  }
}
