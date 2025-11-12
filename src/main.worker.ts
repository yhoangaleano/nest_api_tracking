// Framework imports
import { NestFactory } from '@nestjs/core';

// Own code imports
import { AppModule } from './app.module';

async function bootstrapWorker() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);

    console.log('[Worker] Started successfully');
    console.log('[Worker] Listening for checkpoint messages...');

    process.on('SIGTERM', () => {
      console.log('[Worker] SIGTERM received, closing gracefully...');
      void app.close().then(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      console.log('[Worker] SIGINT received, closing gracefully...');
      void app.close().then(() => process.exit(0));
    });
  } catch (error) {
    console.error('[Worker] Failed to start:', error);
    process.exit(1);
  }
}

void bootstrapWorker();
