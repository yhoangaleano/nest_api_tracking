import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, errors, json, printf } = winston.format;

const consoleFormat = printf((info) => {
  const { level, message, timestamp, context, ...metadata } = info as {
    level: string;
    message: string;
    timestamp: string;
    context?: string;
    [key: string]: unknown;
  };

  let msg = `${timestamp} [${level}]`;

  if (context) {
    msg += ` [${context}]`;
  }

  msg += ` ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

export const createLoggerConfig = (nodeEnv: string) => {
  const isDevelopment = nodeEnv === 'development';

  return {
    level: isDevelopment ? 'debug' : 'info',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      isDevelopment ? consoleFormat : json(),
    ),
    transports: [
      new winston.transports.Console({
        format: isDevelopment
          ? combine(
              timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              nestWinstonModuleUtilities.format.nestLike('TrackingAPI', {
                colors: true,
                prettyPrint: true,
              }),
            )
          : json(),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: json(),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: json(),
      }),
    ],
  };
};
