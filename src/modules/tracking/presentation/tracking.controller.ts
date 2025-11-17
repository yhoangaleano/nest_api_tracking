// Framework imports
import {
  BadRequestException,
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

// Auth decorators
import { Public } from '../../auth/presentation/decorators/public.decorator';

// Presentation layer
import { CreateUnitDto } from './dtos/create-unit.dto';
import { ListUnitsQueryDto } from './dtos/list-units-query.dto';
import { RegisterCheckpointDto } from './dtos/register-checkpoint.dto';
import { CreateUnitResponseDto } from './dtos/output/create-unit-response.dto';
import { UnitResponseDto } from './dtos/output/unit-response.dto';
import { UnitSummaryResponseDto } from './dtos/output/unit-summary-response.dto';
import {
  CheckpointDataMapper,
  TrackingIdMapper,
  UnitStateQueryMapper,
  UnitResponseMapper,
  UnitSummaryResponseMapper,
} from './mappers';

// Application layer
import {
  ICreateUnitUseCase,
  CREATE_UNIT_USE_CASE_TOKEN,
} from '../application/use-cases';

// Domain layer
import {
  UnitNotFoundError,
  InvalidValueObjectError,
  InvalidStateTransitionError,
  IGetTrackingHistoryUseCase,
  IListUnitsByStateUseCase,
  IRegisterCheckpointUseCase,
  GET_TRACKING_HISTORY_USE_CASE_TOKEN,
  LIST_UNITS_BY_STATE_USE_CASE_TOKEN,
  REGISTER_CHECKPOINT_USE_CASE_TOKEN,
} from '../domain';

@ApiTags('tracking')
@Controller('api/v1')
export class TrackingController {
  constructor(
    @Inject(CREATE_UNIT_USE_CASE_TOKEN)
    private readonly createUnitUseCase: ICreateUnitUseCase,
    @Inject(REGISTER_CHECKPOINT_USE_CASE_TOKEN)
    private readonly registerCheckpointUseCase: IRegisterCheckpointUseCase,
    @Inject(GET_TRACKING_HISTORY_USE_CASE_TOKEN)
    private readonly getTrackingHistoryUseCase: IGetTrackingHistoryUseCase,
    @Inject(LIST_UNITS_BY_STATE_USE_CASE_TOKEN)
    private readonly listUnitsByStateUseCase: IListUnitsByStateUseCase,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TrackingController');
  }

  @Public()
  @Post('checkpoints')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new checkpoint (synchronous)' })
  @ApiResponse({
    status: 200,
    description: 'Checkpoint registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async registerCheckpoint(
    @Body() dto: RegisterCheckpointDto,
  ): Promise<{ message: string }> {
    this.logger.logWithMetadata('info', 'Registering checkpoint', {
      trackingId: dto.trackingId,
      status: dto.status,
      location: dto.location,
    });

    try {
      // Convert DTO to Value Object using mapper
      const checkpointData = CheckpointDataMapper.toValueObject(dto);

      // Execute use case synchronously
      await this.registerCheckpointUseCase.execute(checkpointData);

      this.logger.logWithMetadata(
        'info',
        '✅ Checkpoint registered successfully',
        {
          trackingId: dto.trackingId,
          status: dto.status,
        },
      );

      return {
        message: 'Checkpoint registered successfully',
      };
    } catch (error) {
      if (error instanceof UnitNotFoundError) {
        this.logger.warn(`Unit not found: ${dto.trackingId}`);
        throw new NotFoundException(error.message);
      }
      if (error instanceof InvalidStateTransitionError) {
        this.logger.warn(`Invalid state transition: ${error.message}`);
        throw new BadRequestException(error.message);
      }
      if (error instanceof InvalidValueObjectError) {
        this.logger.warn(`Invalid checkpoint data: ${error.message}`);
        throw new BadRequestException(error.message);
      }
      this.logger.error(
        `Error registering checkpoint: ${dto.trackingId}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Public()
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
      if (error instanceof InvalidValueObjectError) {
        this.logger.warn(`Invalid tracking ID format: ${trackingId}`);
        throw new BadRequestException(error.message);
      }
      this.logger.error(
        `Error retrieving tracking history for: ${trackingId}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Public()
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

  /**
   * 🧪 TESTING ONLY: Create a new unit
   *
   * This endpoint is for development and testing purposes only.
   * In production, units are created by external systems (WMS, TMS, etc.)
   *
   * @param dto - CreateUnitDto with trackingId
   * @returns CreateUnitResponseDto with unit details
   * @throws ConflictException if unit already exists
   * @throws ForbiddenException if called in production environment
   */
  @Public()
  @Post('units')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🧪 Create a new unit (TESTING ONLY)',
    description:
      'Creates a new unit with an initial checkpoint (state = CREATED). ' +
      'This endpoint is for development and testing purposes only. ' +
      'In production, units should be created by external systems (WMS, TMS, etc.).',
  })
  @ApiResponse({
    status: 201,
    description: 'Unit created successfully',
    type: CreateUnitResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Unit already exists' })
  @ApiResponse({
    status: 403,
    description: 'Endpoint only available in development',
  })
  async createUnit(@Body() dto: CreateUnitDto): Promise<CreateUnitResponseDto> {
    this.logger.logWithMetadata('info', '🧪 Creating unit for testing', {
      trackingId: dto.trackingId,
    });

    try {
      // Create unit with initial checkpoint (state = CREATED)
      const unit = await this.createUnitUseCase.execute(dto.trackingId);

      this.logger.logWithMetadata('info', '✅ Unit created successfully', {
        trackingId: unit.trackingId,
        currentState: unit.currentState,
      });

      return {
        trackingId: unit.trackingId,
        currentState: unit.currentState,
        createdAt: new Date().toISOString(),
        success: true,
        message: 'Unit created successfully',
      };
    } catch (error) {
      // ConflictException is already thrown by use case
      this.logger.error(
        `Error creating unit: ${dto.trackingId}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
