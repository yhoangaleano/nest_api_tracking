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

// Presentation layer
import { ListUnitsQueryDto } from './dtos/list-units-query.dto';
import { RegisterCheckpointDto } from './dtos/register-checkpoint.dto';
import { UnitResponseDto } from './dtos/output/unit-response.dto';
import { UnitSummaryResponseDto } from './dtos/output/unit-summary-response.dto';
import {
  CheckpointDataMapper,
  TrackingIdMapper,
  UnitStateQueryMapper,
  UnitResponseMapper,
  UnitSummaryResponseMapper,
} from './mappers';

// Domain layer
import {
  UnitNotFoundError,
  IGetTrackingHistoryUseCase,
  IListUnitsByStateUseCase,
  ICheckpointProducer,
  GET_TRACKING_HISTORY_USE_CASE_TOKEN,
  LIST_UNITS_BY_STATE_USE_CASE_TOKEN,
  CHECKPOINT_PRODUCER_TOKEN,
} from '../domain';

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

    // Convert DTO to Value Object using mapper
    const checkpointData = CheckpointDataMapper.toValueObject(dto);

    this.checkpointProducer.publish(checkpointData);

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
      // Convert string to Value Object
      const trackingIdVO = TrackingIdMapper.toValueObject(trackingId);

      // Use Case returns Unit entity
      const unit = await this.getTrackingHistoryUseCase.execute(trackingIdVO);

      this.logger.log(
        `Tracking history retrieved successfully for: ${trackingId}`,
      );

      // Convert Unit entity to DTO using mapper
      return UnitResponseMapper.toDto(unit);
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

    // Convert DTO to Value Object
    const stateQuery = UnitStateQueryMapper.toValueObject(query);

    // Use Case returns Unit[] entities
    const units = await this.listUnitsByStateUseCase.execute(stateQuery);

    this.logger.logWithMetadata('info', 'Shipments listed', {
      status: query.status,
      count: units.length,
    });

    // Convert Unit[] to DTOs using mapper
    return UnitSummaryResponseMapper.toDtoList(units);
  }
}
