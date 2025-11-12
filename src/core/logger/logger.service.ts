import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  constructor(private readonly winstonLogger: Logger) {}

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string): void {
    this.winstonLogger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.winstonLogger.error(message, {
      context: context || this.context,
      stack: trace,
    });
  }

  warn(message: string, context?: string): void {
    this.winstonLogger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string): void {
    this.winstonLogger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string): void {
    this.winstonLogger.verbose(message, { context: context || this.context });
  }

  logWithMetadata(
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    metadata: Record<string, unknown>,
  ): void {
    this.winstonLogger.log(level, message, {
      context: this.context,
      ...metadata,
    });
  }

  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
  ): void {
    this.winstonLogger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  logCheckpoint(trackingId: string, status: string, location: string): void {
    this.winstonLogger.info('Checkpoint registered', {
      context: 'Checkpoint',
      trackingId,
      status,
      location,
    });
  }

  logInvalidTransition(
    trackingId: string,
    currentState: string,
    attemptedState: string,
  ): void {
    this.winstonLogger.warn('Invalid state transition attempted', {
      context: 'StateMachine',
      trackingId,
      currentState,
      attemptedState,
    });
  }
}
