import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import {
  setupTestContainers,
  teardownTestContainers,
} from './testcontainers.setup';
import { UNIT_STATE_ENUMERATION } from '../src/modules/tracking/domain/configs';

process.env.DISABLE_AUTH = 'true';

interface CheckpointResponse {
  status: string;
  location: string;
  timestamp: string;
  notes?: string;
}

interface UnitResponse {
  id: string;
  trackingId: string;
  currentState: string;
  checkpoints: CheckpointResponse[];
}

interface CreateUnitResponse {
  trackingId: string;
  currentState: string;
  createdAt: string;
  success: boolean;
  message: string;
}

interface MessageResponse {
  message: string;
}

interface UnitSummaryResponse {
  trackingId: string;
  currentState: string;
}

describe('Tracking (e2e) - Happy Path', () => {
  let app: INestApplication<App>;
  const trackingId = `TRK-${Date.now()}`;

  beforeAll(async () => {
    await setupTestContainers();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await teardownTestContainers();
  });

  describe('Complete Delivery Flow', () => {
    it('should create a new unit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/units')
        .send({ trackingId })
        .expect(201);

      const body = response.body as CreateUnitResponse;
      expect(body).toMatchObject({
        trackingId,
        currentState: UNIT_STATE_ENUMERATION.CREATED,
        success: true,
        message: 'Unit created successfully',
      });
      expect(body.createdAt).toBeDefined();
    });

    it('should reject duplicate unit creation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/units')
        .send({ trackingId })
        .expect(409);

      const body = response.body as MessageResponse;
      expect(body.message).toContain('already exists');
    });

    it('should register PICKED_UP checkpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId,
          status: UNIT_STATE_ENUMERATION.PICKED_UP,
          location: 'Warehouse A',
          timestamp: new Date().toISOString(),
          notes: 'Package picked up from sender',
        })
        .expect(200);

      const body = response.body as MessageResponse;
      expect(body.message).toBe('Checkpoint registered successfully');
    });

    it('should register IN_TRANSIT checkpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId,
          status: UNIT_STATE_ENUMERATION.IN_TRANSIT,
          location: 'Truck-001',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      const body = response.body as MessageResponse;
      expect(body.message).toBe('Checkpoint registered successfully');
    });

    it('should register AT_FACILITY checkpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId,
          status: UNIT_STATE_ENUMERATION.AT_FACILITY,
          location: 'Distribution Center',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      const body = response.body as MessageResponse;
      expect(body.message).toBe('Checkpoint registered successfully');
    });

    it('should register OUT_FOR_DELIVERY checkpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId,
          status: UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          location: 'Van-789',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      const body = response.body as MessageResponse;
      expect(body.message).toBe('Checkpoint registered successfully');
    });

    it('should register DELIVERED checkpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId,
          status: UNIT_STATE_ENUMERATION.DELIVERED,
          location: 'Customer Address',
          timestamp: new Date().toISOString(),
          notes: 'Delivered to recipient',
        })
        .expect(200);

      const body = response.body as MessageResponse;
      expect(body.message).toBe('Checkpoint registered successfully');
    });

    it('should get complete tracking history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tracking/${trackingId}`)
        .expect(200);

      const body = response.body as UnitResponse;
      expect(body.trackingId).toBe(trackingId);
      expect(body.currentState).toBe(UNIT_STATE_ENUMERATION.DELIVERED);
      expect(body.checkpoints).toHaveLength(6);

      const states = body.checkpoints.map((cp) => cp.status);
      expect(states).toEqual([
        UNIT_STATE_ENUMERATION.CREATED,
        UNIT_STATE_ENUMERATION.PICKED_UP,
        UNIT_STATE_ENUMERATION.IN_TRANSIT,
        UNIT_STATE_ENUMERATION.AT_FACILITY,
        UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
        UNIT_STATE_ENUMERATION.DELIVERED,
      ]);
    });

    it('should list units by DELIVERED state', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/shipments')
        .query({ status: UNIT_STATE_ENUMERATION.DELIVERED })
        .expect(200);

      const body = response.body as UnitSummaryResponse[];
      expect(Array.isArray(body)).toBe(true);

      const found = body.find((unit) => unit.trackingId === trackingId);
      expect(found).toBeDefined();
      expect(found!.currentState).toBe(UNIT_STATE_ENUMERATION.DELIVERED);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent tracking ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tracking/TRK-999999999')
        .expect(404);

      const body = response.body as MessageResponse;
      expect(body.message).toContain('not found');
    });

    it('should return 400 for invalid state transition', async () => {
      const newTrackingId = `TRK-${Date.now() + 1}`;

      await request(app.getHttpServer())
        .post('/api/v1/units')
        .send({ trackingId: newTrackingId })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: newTrackingId,
          status: UNIT_STATE_ENUMERATION.DELIVERED,
          location: 'Invalid Location',
          timestamp: new Date().toISOString(),
        })
        .expect(400);

      const body = response.body as MessageResponse;
      expect(body.message).toContain('Invalid state transition');
    });

    it('should return 404 when registering checkpoint for non-existent unit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: 'TRK-888888888',
          status: UNIT_STATE_ENUMERATION.PICKED_UP,
          location: 'Warehouse',
          timestamp: new Date().toISOString(),
        })
        .expect(404);

      const body = response.body as MessageResponse;
      expect(body.message).toContain('not found');
    });

    it('should return 400 for invalid tracking ID format on create', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/units')
        .send({ trackingId: 'AB' })
        .expect(400);

      const body = response.body as MessageResponse;
      expect(body.message).toBeDefined();
    });
  });

  describe('Exception Flow', () => {
    it('should handle delivery exception and retry', async () => {
      const exceptionTrackingId = `TRK-${Date.now() + 2}`;

      await request(app.getHttpServer())
        .post('/api/v1/units')
        .send({ trackingId: exceptionTrackingId })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: exceptionTrackingId,
          status: UNIT_STATE_ENUMERATION.PICKED_UP,
          location: 'Warehouse',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: exceptionTrackingId,
          status: UNIT_STATE_ENUMERATION.IN_TRANSIT,
          location: 'Truck',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: exceptionTrackingId,
          status: UNIT_STATE_ENUMERATION.AT_FACILITY,
          location: 'Distribution Center',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: exceptionTrackingId,
          status: UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          location: 'Van',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: exceptionTrackingId,
          status: UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY_EXCEPTION,
          location: 'Customer Address',
          timestamp: new Date().toISOString(),
          notes: 'Customer not available',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: exceptionTrackingId,
          status: UNIT_STATE_ENUMERATION.OUT_FOR_DELIVERY,
          location: 'Van',
          timestamp: new Date().toISOString(),
          notes: 'Second delivery attempt',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/checkpoints')
        .send({
          trackingId: exceptionTrackingId,
          status: UNIT_STATE_ENUMERATION.DELIVERED,
          location: 'Customer Address',
          timestamp: new Date().toISOString(),
          notes: 'Successfully delivered on second attempt',
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/tracking/${exceptionTrackingId}`)
        .expect(200);

      const body = response.body as UnitResponse;
      expect(body.checkpoints).toHaveLength(8);
      expect(body.currentState).toBe(UNIT_STATE_ENUMERATION.DELIVERED);
    });
  });
});
