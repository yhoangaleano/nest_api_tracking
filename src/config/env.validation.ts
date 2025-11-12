// Third-party libraries
import * as Joi from 'joi';

/**
 * Joi validation schema for environment variables
 * Ensures application fails fast on startup if required variables are missing or invalid
 */
export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(),

  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  CHECKPOINT_QUEUE_NAME: Joi.string().default('checkpoint_events'),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Security
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3001'),
});
