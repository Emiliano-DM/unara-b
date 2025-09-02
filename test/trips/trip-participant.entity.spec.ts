import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { ParticipantRole } from '../../src/common/enums/participant-role.enum';
import { ParticipantStatus } from '../../src/common/enums/participant-status.enum';

describe('TripParticipant Entity', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let tripRepository: Repository<Trip>;
  let participantRepository: Repository<TripParticipant>;
  let userRepository: Repository<User>;
  let testOwner: User;
  let testParticipant: User;
  let testTrip: Trip;

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
          entities: [Trip, TripParticipant, User],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Trip, TripParticipant, User]),
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    tripRepository = dataSource.getRepository(Trip);
    participantRepository = dataSource.getRepository(TripParticipant);
    userRepository = dataSource.getRepository(User);

    // Create test users
    testOwner = userRepository.create({
      fullname: 'Trip Owner',
      email: 'owner@example.com',
      username: 'tripowner',
      password: 'hashedpassword',
    });
    await userRepository.save(testOwner);

    testParticipant = userRepository.create({
      fullname: 'Trip Participant',
      email: 'participant@example.com',
      username: 'participant',
      password: 'hashedpassword',
    });
    await userRepository.save(testParticipant);

    // Create test trip
    testTrip = tripRepository.create({
      name: 'Test Trip',
      owner: testOwner,
    });
    await tripRepository.save(testTrip);
  });

  afterEach(async () => {
    await dataSource.destroy();
    await module.close();
  });

  it('should create a trip participant', async () => {
    const participant = participantRepository.create({
      trip: testTrip,
      user: testParticipant,
      invitedBy: testOwner,
      role: ParticipantRole.PARTICIPANT,
      status: ParticipantStatus.INVITED,
    });

    const savedParticipant = await participantRepository.save(participant);

    expect(savedParticipant.id).toBeDefined();
    expect(savedParticipant.role).toBe(ParticipantRole.PARTICIPANT);
    expect(savedParticipant.status).toBe(ParticipantStatus.INVITED);
  });

  it('should have default role as participant', async () => {
    const participant = participantRepository.create({
      trip: testTrip,
      user: testParticipant,
      invitedBy: testOwner,
    });

    const savedParticipant = await participantRepository.save(participant);

    expect(savedParticipant.role).toBe('participant');
  });

  it('should have default status as invited', async () => {
    const participant = participantRepository.create({
      trip: testTrip,
      user: testParticipant,
      invitedBy: testOwner,
    });

    const savedParticipant = await participantRepository.save(participant);

    expect(savedParticipant.status).toBe('invited');
  });

  it('should prevent duplicate participation', async () => {
    // Create first participant
    const participant1 = participantRepository.create({
      trip: testTrip,
      user: testParticipant,
      invitedBy: testOwner,
    });
    await participantRepository.save(participant1);

    // Try to create duplicate
    const participant2 = participantRepository.create({
      trip: testTrip,
      user: testParticipant,
      invitedBy: testOwner,
    });

    await expect(participantRepository.save(participant2)).rejects.toThrow();
  });

  it('should relate to trip and users correctly', async () => {
    const participant = participantRepository.create({
      trip: testTrip,
      user: testParticipant,
      invitedBy: testOwner,
    });

    const savedParticipant = await participantRepository.save(participant);
    const participantWithRelations = await participantRepository.findOne({
      where: { id: savedParticipant.id },
      relations: ['trip', 'user', 'invitedBy'],
    });

    expect(participantWithRelations.trip.id).toBe(testTrip.id);
    expect(participantWithRelations.user.id).toBe(testParticipant.id);
    expect(participantWithRelations.invitedBy.id).toBe(testOwner.id);
  });

  it('should update joinedAt when status changes to joined', async () => {
    const participant = participantRepository.create({
      trip: testTrip,
      user: testParticipant,
      invitedBy: testOwner,
      status: ParticipantStatus.INVITED,
    });

    const savedParticipant = await participantRepository.save(participant);
    
    // Update status to joined
    savedParticipant.status = ParticipantStatus.JOINED;
    savedParticipant.joinedAt = new Date();
    
    const updatedParticipant = await participantRepository.save(savedParticipant);

    expect(updatedParticipant.status).toBe(ParticipantStatus.JOINED);
    expect(updatedParticipant.joinedAt).toBeDefined();
  });
});