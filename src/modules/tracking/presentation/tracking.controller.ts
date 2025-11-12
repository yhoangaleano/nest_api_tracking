// Framework imports
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// Core layer
import { LoggerService } from '../../../core/logger/logger.service';

// Application layer
import { RegisterCheckpointDto } from '../application/dtos/register-checkpoint.dto';
import { GetTrackingHistoryUseCase } from '../application/use-cases/get-tracking-history.use-case';
import { ListUnitsByStateUseCase } from '../application/use-cases/list-units-by-state.use-case';

// Domain layer
import { UnitNotFoundError } from '../domain/unit.errors';

// Infrastructure layer
import { CheckpointProducer } from '../infrastructure/messaging/checkpoint.producer';

// Presentation layer
import { ListUnitsQueryDto } from './dtos/list-units-query.dto';
import { UnitResponseDto } from './dtos/unit-response.dto';
import { UnitSummaryResponseDto } from './dtos/unit-summary-response.dto';

@ApiTags('tracking')
@Controller('api/v1')
export class TrackingController {
  constructor(
    private readonly checkpointProducer: CheckpointProducer,
    private readonly getTrackingHistoryUseCase: GetTrackingHistoryUseCase,
    private readonly listUnitsByStateUseCase: ListUnitsByStateUseCase,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TrackingController');
  }

  @Post('checkpoints')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Register a new checkpoint (asynchronous)' })
  @ApiResponse({ status: 202, description: 'Checkpoint queued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  registerCheckpoint(@Body() dto: RegisterCheckpointDto): { message: string } {
    this.logger.logWithMetadata('info', 'Checkpoint received', {
      trackingId: dto.trackingId,
      status: dto.status,
      location: dto.location,
    });

    this.checkpointProducer.publish(dto);

    return {
      message: 'Checkpoint received and queued for processing.',
    };
  }

  @Get('tracking/:trackingId')
  @ApiOperation({ summary: 'Get complete tracking history' })
  @ApiResponse({
    status: 200,
    description: 'History found',
    type: UnitResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async getTrackingHistory(
    @Param('trackingId') trackingId: string,
  ): Promise<UnitResponseDto> {
    this.logger.debug(`Retrieving tracking history for: ${trackingId}`);

    try {
      const unit = await this.getTrackingHistoryUseCase.execute(trackingId);
      this.logger.log(
        `Tracking history retrieved successfully for: ${trackingId}`,
      );
      return UnitResponseDto.fromEntity(unit);
    } catch (error) {
      if (error instanceof UnitNotFoundError) {
        this.logger.warn(`Unit not found: ${trackingId}`);
        throw new NotFoundException(error.message);
      }
      this.logger.error(
        `Error retrieving tracking history for: ${trackingId}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Get('shipments')
  @ApiOperation({ summary: 'List units by state' })
  @ApiResponse({
    status: 200,
    description: 'List of units',
    type: [UnitSummaryResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid state' })
  async listShipmentsByState(
    @Query() query: ListUnitsQueryDto,
  ): Promise<UnitSummaryResponseDto[]> {
    this.logger.debug(`Listing shipments by state: ${query.status}`);

    const units = await this.listUnitsByStateUseCase.execute(query.status);

    this.logger.logWithMetadata('info', 'Shipments listed', {
      status: query.status,
      count: units.length,
    });

    return units.map((unit) => UnitSummaryResponseDto.fromEntity(unit));
  }
}
