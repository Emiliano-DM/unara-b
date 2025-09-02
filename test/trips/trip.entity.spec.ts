import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Trip } from '../../src/trips/entities/trip.entity';
import { User } from '../../src/users/entities/user.entity';
import { TripStatus } from '../../src/common/enums/trip-status.enum';

describe('Trip Entity', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let tripRepository: Repository<Trip>;
  let userRepository: Repository<User>;
  let testUser: User;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_NAME || 'test_db',
          entities: [Trip, User],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Trip, User]),
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    tripRepository = dataSource.getRepository(Trip);
    userRepository = dataSource.getRepository(User);

    // Create test user
    testUser = userRepository.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      emailVerified: true,
      isActive: true,
    });
    await userRepository.save(testUser);
  });

  afterEach(async () => {
    await dataSource.destroy();
    await module.close();
  });

  it('should create a trip with required fields', async () => {
    const trip = tripRepository.create({
      name: 'Test Trip',
      description: 'A test trip',
      destination: 'Test Destination',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-07'),
      owner: testUser,
    });

    const savedTrip = await tripRepository.save(trip);

    expect(savedTrip.id).toBeDefined();
    expect(savedTrip.name).toBe('Test Trip');
    expect(savedTrip.description).toBe('A test trip');
    expect(savedTrip.destination).toBe('Test Destination');
    expect(savedTrip.owner.id).toBe(testUser.id);
  });

  it('should generate share token automatically', async () => {
    const trip = tripRepository.create({
      name: 'Test Trip',
      owner: testUser,
    });

    const savedTrip = await tripRepository.save(trip);

    expect(savedTrip.shareToken).toBeDefined();
    expect(savedTrip.shareToken).toHaveLength(32);
  });

  it('should have default status of PLANNING', async () => {
    const trip = tripRepository.create({
      name: 'Test Trip',
      owner: testUser,
    });

    const savedTrip = await tripRepository.save(trip);

    expect(savedTrip.status).toBe(TripStatus.PLANNING);
  });

  it('should have default isPublic as false', async () => {
    const trip = tripRepository.create({
      name: 'Test Trip',
      owner: testUser,
    });

    const savedTrip = await tripRepository.save(trip);

    expect(savedTrip.isPublic).toBe(false);
  });

  it('should belong to owner user', async () => {
    const trip = tripRepository.create({
      name: 'Test Trip',
      owner: testUser,
    });

    const savedTrip = await tripRepository.save(trip);
    const tripWithOwner = await tripRepository.findOne({
      where: { id: savedTrip.id },
      relations: ['owner'],
    });

    expect(tripWithOwner.owner.id).toBe(testUser.id);
    expect(tripWithOwner.owner.email).toBe(testUser.email);
  });

  it('should require name field', async () => {
    const trip = tripRepository.create({
      owner: testUser,
    });

    await expect(tripRepository.save(trip)).rejects.toThrow();
  });

  it('should require owner field', async () => {
    const trip = tripRepository.create({
      name: 'Test Trip',
    });

    await expect(tripRepository.save(trip)).rejects.toThrow();
  });

  describe('Budget and Planning Fields', () => {
    it('should save budget as decimal', async () => {
      const trip = tripRepository.create({
        name: 'Budget Trip',
        owner: testUser,
        budget: 1500.50,
        currency: 'EUR',
      });

      const savedTrip = await tripRepository.save(trip);

      expect(savedTrip.budget).toBe('1500.50');
      expect(savedTrip.currency).toBe('EUR');
    });

    it('should set maxParticipants constraint', async () => {
      const trip = tripRepository.create({
        name: 'Limited Trip',
        owner: testUser,
        maxParticipants: 5,
      });

      const savedTrip = await tripRepository.save(trip);

      expect(savedTrip.maxParticipants).toBe(5);
    });

    it('should handle optional planning fields', async () => {
      const trip = tripRepository.create({
        name: 'Detailed Trip',
        owner: testUser,
        category: 'Adventure',
        departureLocation: 'New York',
        timeZone: 'America/New_York',
        accommodation: 'Hotels and Airbnb',
        transportation: 'Flight + Car rental',
        bookingDeadline: new Date('2024-05-01'),
        requirements: 'Passport required, health insurance recommended',
      });

      const savedTrip = await tripRepository.save(trip);

      expect(savedTrip.category).toBe('Adventure');
      expect(savedTrip.departureLocation).toBe('New York');
      expect(savedTrip.timeZone).toBe('America/New_York');
      expect(savedTrip.accommodation).toBe('Hotels and Airbnb');
      expect(savedTrip.transportation).toBe('Flight + Car rental');
      expect(savedTrip.bookingDeadline).toEqual(new Date('2024-05-01'));
      expect(savedTrip.requirements).toBe('Passport required, health insurance recommended');
    });
  });

  describe('Status Management', () => {
    it('should accept valid trip status values', async () => {
      const statuses = [TripStatus.PLANNING, TripStatus.ACTIVE, TripStatus.COMPLETED, TripStatus.CANCELLED];
      
      for (const status of statuses) {
        const trip = tripRepository.create({
          name: `Trip ${status}`,
          owner: testUser,
          status,
        });

        const savedTrip = await tripRepository.save(trip);
        expect(savedTrip.status).toBe(status);
      }
    });
  });

  describe('Currency and Internationalization', () => {
    it('should default to USD currency', async () => {
      const trip = tripRepository.create({
        name: 'Default Currency Trip',
        owner: testUser,
      });

      const savedTrip = await tripRepository.save(trip);

      expect(savedTrip.currency).toBe('USD');
    });

    it('should store coordinates as JSON', async () => {
      const coordinates = JSON.stringify({ lat: 40.7128, lng: -74.0060 });
      const trip = tripRepository.create({
        name: 'GPS Trip',
        owner: testUser,
        coordinates,
      });

      const savedTrip = await tripRepository.save(trip);

      expect(savedTrip.coordinates).toBe(coordinates);
      expect(JSON.parse(savedTrip.coordinates)).toEqual({ lat: 40.7128, lng: -74.0060 });
    });
  });
});