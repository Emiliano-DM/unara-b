import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Trip } from '../../src/trips/entities/trip.entity';
import { User } from '../../src/users/entities/user.entity';

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
      fullname: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
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

  it('should have default status of planning', async () => {
    const trip = tripRepository.create({
      name: 'Test Trip',
      owner: testUser,
    });

    const savedTrip = await tripRepository.save(trip);

    expect(savedTrip.status).toBe('planning');
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
});