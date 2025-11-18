import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth/presentation/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-11-17T14:30:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        environment: { type: 'string', example: 'production' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  healthCheck() {
    return this.appService.healthCheck();
  }

  @Public()
  @Get('health/ready')
  @ApiOperation({
    summary: 'Readiness probe - checks database and cache connections',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to accept traffic',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready (database or cache unavailable)',
  })
  async readinessCheck() {
    return this.appService.readinessCheck();
  }
}

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly appService: AppService) {}

  @Get('cache/clear')
  @ApiOperation({
    summary: 'Clear all cache entries',
    description:
      'Removes all cached data from Redis. Use with caution in production.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cache cleared successfully' },
        timestamp: { type: 'string', example: '2025-11-17T15:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to clear cache',
  })
  async clearCache() {
    return this.appService.clearCache();
  }

  @Get('cache/stats')
  @ApiOperation({
    summary: 'Get cache statistics',
    description: 'Returns information about cache usage and performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved',
  })
  async getCacheStats() {
    return this.appService.getCacheStats();
  }
}
