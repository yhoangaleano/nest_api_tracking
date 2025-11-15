// Framework imports
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// Core layer
import { LoggerService } from '../../../core/logger/logger.service';

// Application layer
import { RegisterCheckpointInput } from '../application/dtos/input/register-checkpoint.input';
import { UnitResponseOutput } from '../application/dtos/output/unit-response.output';
import { UnitSummaryResponseOutput } from '../application/dtos/output/unit-summary-response.output';
import {
  GET_TRACKING_HISTORY_USE_CASE_TOKEN,
  LIST_UNITS_BY_STATE_USE_CASE_TOKEN,
  IGetTrackingHistoryUseCase,
  IListUnitsByStateUseCase,
} from '../application/use-cases/interfaces';
import {
  ICheckpointProducer,
  CHECKPOINT_PRODUCER_TOKEN,
} from '../application/messaging/checkpoint-producer.interface';

// Domain layer
import { UnitNotFoundError } from '../domain/unit.errors';

// Presentation layer
import { ListUnitsQueryDto } from './dtos/list-units-query.dto';
import { RegisterCheckpointDto } from './dtos/register-checkpoint.dto';

@ApiTags('tracking')
@Controller('api/v1')
export class TrackingController {
  constructor(
    @Inject(CHECKPOINT_PRODUCER_TOKEN)
    private readonly checkpointProducer: ICheckpointProducer,
    @Inject(GET_TRACKING_HISTORY_USE_CASE_TOKEN)
    private readonly getTrackingHistoryUseCase: IGetTrackingHistoryUseCase,
    @Inject(LIST_UNITS_BY_STATE_USE_CASE_TOKEN)
    private readonly listUnitsByStateUseCase: IListUnitsByStateUseCase,
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

    const input: RegisterCheckpointInput = {
      trackingId: dto.trackingId,
      status: dto.status,
      location: dto.location,
      timestamp: dto.timestamp,
      notes: dto.notes,
    };

    this.checkpointProducer.publish(input);

    return {
      message: 'Checkpoint received and queued for processing.',
    };
  }

  @Get('tracking/:trackingId')
  @ApiOperation({ summary: 'Get complete tracking history' })
  @ApiResponse({
    status: 200,
    description: 'History found',
    type: UnitResponseOutput,
  })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async getTrackingHistory(
    @Param('trackingId') trackingId: string,
  ): Promise<UnitResponseOutput> {
    this.logger.debug(`Retrieving tracking history for: ${trackingId}`);

    try {
      const unitOutput =
        await this.getTrackingHistoryUseCase.execute(trackingId);
      this.logger.log(
        `Tracking history retrieved successfully for: ${trackingId}`,
      );
      return unitOutput;
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
    type: [UnitSummaryResponseOutput],
  })
  @ApiResponse({ status: 400, description: 'Invalid state' })
  async listShipmentsByState(
    @Query() query: ListUnitsQueryDto,
  ): Promise<UnitSummaryResponseOutput[]> {
    this.logger.debug(`Listing shipments by state: ${query.status}`);

    const unitOutputs = await this.listUnitsByStateUseCase.execute(
      query.status,
    );

    this.logger.logWithMetadata('info', 'Shipments listed', {
      status: query.status,
      count: unitOutputs.length,
    });

    return unitOutputs;
  }
}
