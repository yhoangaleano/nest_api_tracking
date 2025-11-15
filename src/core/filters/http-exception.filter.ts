import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { LoggerService } from '../logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message ||
          exception.message;

    const errorResponse: {
      statusCode: number;
      timestamp: string;
      path: string;
      method: string;
      message: string | string[];
      error: string;
      validationErrors?: string[];
    } = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: exception.name,
    };

    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse &&
      Array.isArray(exceptionResponse.message)
    ) {
      errorResponse.validationErrors = exceptionResponse.message;
    }

    this.logger.logWithMetadata(
      status >= 500 ? 'error' : 'warn',
      `HTTP Exception: ${exception.message}`,
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        userAgent: request.headers['user-agent'],
      },
    );

    response.status(status).json(errorResponse);
  }
}
