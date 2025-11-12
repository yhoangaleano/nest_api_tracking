const configuration = () => ({
  port: Number.parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/tracking_db',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },
  queue: {
    checkpointQueueName:
      process.env.CHECKPOINT_QUEUE_NAME || 'checkpoint_events',
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiration: process.env.JWT_EXPIRATION || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3001',
  },
});
export default configuration;
