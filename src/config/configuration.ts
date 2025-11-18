const configuration = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '3000', 10),

  postgres: {
    url: process.env.DATABASE_URL,
    synchronize: process.env.POSTGRES_SYNC === 'true',
    logging: process.env.NODE_ENV === 'development',
  },

  redis: {
    url: process.env.REDIS_URL,
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
