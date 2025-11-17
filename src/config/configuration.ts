const configuration = () => ({
  port: Number.parseInt(process.env.PORT || '3000', 10),

  // PostgreSQL (nuevo - migración)
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number.parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'tracking_user',
    password: process.env.POSTGRES_PASSWORD || 'tracking_pass',
    database: process.env.POSTGRES_DATABASE || 'tracking_db',
    synchronize: process.env.POSTGRES_SYNC === 'true', // false en producción
    logging: process.env.NODE_ENV === 'development',
  },

  // Redis (cache)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: Number.parseInt(process.env.REDIS_TTL || '3600', 10),
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
