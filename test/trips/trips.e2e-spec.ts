import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Trip } from '../../src/trips/entities/trip.entity';

describe('TripsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: User;
  let testUser2: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    // Create test users
    const userRepository = dataSource.getRepository(User);
    
    testUser = userRepository.create({
      fullname: 'Test User 1',
      email: 'test1@example.com',
      username: 'testuser1',
      password: 'hashedpassword',
    });
    await userRepository.save(testUser);

    testUser2 = userRepository.create({
      fullname: 'Test User 2',
      email: 'test2@example.com',
      username: 'testuser2',
      password: 'hashedpassword',
    });
    await userRepository.save(testUser2);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up trips between tests
    const tripRepository = dataSource.getRepository(Trip);
    await tripRepository.delete({});
  });

  describe('/trips (POST)', () => {
    it('should create a trip', () => {
      const createTripDto = {
        name: 'Test Trip',
        description: 'A test trip description',
        destination: 'Test Destination',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        isPublic: false,
      };

      return request(app.getHttpServer())
        .post('/trips')
        .send(createTripDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(createTripDto.name);
          expect(res.body.description).toBe(createTripDto.description);
          expect(res.body.destination).toBe(createTripDto.destination);
          expect(res.body.status).toBe('planning');
          expect(res.body.shareToken).toBeDefined();
          expect(res.body.id).toBeDefined();
        });
    });

    it('should fail with invalid data', () => {
      const invalidTripDto = {
        description: 'Missing name field',
      };

      return request(app.getHttpServer())
        .post('/trips')
        .send(invalidTripDto)
        .expect(400);
    });
  });

  describe('/trips (GET)', () => {
    let testTrip: any;

    beforeEach(async () => {
      // Create a test trip
      const response = await request(app.getHttpServer())
        .post('/trips')
        .send({
          name: 'Test Trip',
          description: 'Test Description',
        });
      testTrip = response.body;
    });

    it('should list user trips', () => {
      return request(app.getHttpServer())
        .get('/trips')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].name).toBe('Test Trip');
        });
    });

    it('should filter trips by search term', () => {
      return request(app.getHttpServer())
        .get('/trips?search=Test')
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].name).toContain('Test');
        });
    });
  });

  describe('/trips/:id (GET)', () => {
    let testTrip: any;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/trips')
        .send({
          name: 'Test Trip',
          description: 'Test Description',
        });
      testTrip = response.body;
    });

    it('should get trip details', () => {
      return request(app.getHttpServer())
        .get(`/trips/${testTrip.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testTrip.id);
          expect(res.body.name).toBe('Test Trip');
          expect(res.body.owner).toBeDefined();
          expect(res.body.participants).toBeDefined();
        });
    });

    it('should return 404 for non-existent trip', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      return request(app.getHttpServer())
        .get(`/trips/${fakeId}`)
        .expect(404);
    });
  });

  describe('/trips/:id (PATCH)', () => {
    let testTrip: any;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/trips')
        .send({
          name: 'Test Trip',
          description: 'Test Description',
        });
      testTrip = response.body;
    });

    it('should update trip', () => {
      const updateDto = {
        name: 'Updated Trip Name',
        status: 'active',
      };

      return request(app.getHttpServer())
        .patch(`/trips/${testTrip.id}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Trip Name');
          expect(res.body.status).toBe('active');
        });
    });
  });

  describe('/trips/:id (DELETE)', () => {
    let testTrip: any;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/trips')
        .send({
          name: 'Trip to Delete',
        });
      testTrip = response.body;
    });

    it('should delete trip', () => {
      return request(app.getHttpServer())
        .delete(`/trips/${testTrip.id}`)
        .expect(200);
    });
  });

  describe('/trips/share/:token (GET)', () => {
    let testTrip: any;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/trips')
        .send({
          name: 'Public Trip',
          isPublic: true,
        });
      testTrip = response.body;
    });

    it('should get trip by share token', () => {
      return request(app.getHttpServer())
        .get(`/trips/share/${testTrip.shareToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Public Trip');
          expect(res.body.owner).toBeDefined();
        });
    });
  });
});