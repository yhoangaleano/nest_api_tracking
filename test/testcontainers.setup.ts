import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

let postgresContainer: StartedPostgreSqlContainer;
let redisContainer: StartedTestContainer;

export async function setupTestContainers(): Promise<void> {
  console.log('Starting test containers...');

  postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
    .withDatabase('tracking_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  process.env.POSTGRES_HOST = postgresContainer.getHost();
  process.env.POSTGRES_PORT = postgresContainer.getPort().toString();
  process.env.POSTGRES_DATABASE = postgresContainer.getDatabase();
  process.env.POSTGRES_USER = postgresContainer.getUsername();
  process.env.POSTGRES_PASSWORD = postgresContainer.getPassword();
  process.env.POSTGRES_SYNC = 'true';

  process.env.REDIS_HOST = redisContainer.getHost();
  process.env.REDIS_PORT = redisContainer.getMappedPort(6379).toString();

  console.log(
    `PostgreSQL running on ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`,
  );
  console.log(
    `Redis running on ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  );
}

export async function teardownTestContainers(): Promise<void> {
  console.log('Stopping test containers...');

  if (postgresContainer) {
    await postgresContainer.stop();
  }

  if (redisContainer) {
    await redisContainer.stop();
  }

  console.log('Test containers stopped');
}

export { postgresContainer, redisContainer };
