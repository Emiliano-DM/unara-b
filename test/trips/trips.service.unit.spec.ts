import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../../src/trips/trips.service';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('TripsService Unit Tests', () => {
  let service: TripsService;
  let tripRepository: jest.Mocked<Repository<Trip>>;
  let participantRepository: jest.Mocked<Repository<TripParticipant>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 'user-1',
    fullname: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTrip: Trip = {
    id: 'trip-1',
    name: 'Test Trip',
    description: 'Test Description',
    destination: 'Test Destination',
    status: 'planning',
    owner: mockUser,
    isPublic: false,
    shareToken: 'test-token-123',
    participants: [],
    luggage: [],
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    generateShareToken: jest.fn(),
  } as Trip;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: getRepositoryToken(Trip),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              leftJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            }),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TripParticipant),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    tripRepository = module.get(getRepositoryToken(Trip));
    participantRepository = module.get(getRepositoryToken(TripParticipant));
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('should create a trip successfully', async () => {
      const createTripDto = {
        name: 'Test Trip',
        description: 'Test Description',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      tripRepository.create.mockReturnValue(mockTrip);
      tripRepository.save.mockResolvedValue(mockTrip);
      participantRepository.create.mockReturnValue({} as TripParticipant);
      participantRepository.save.mockResolvedValue({} as TripParticipant);

      const result = await service.create(createTripDto, mockUser.id);

      expect(result).toEqual(mockTrip);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(tripRepository.create).toHaveBeenCalledWith({ ...createTripDto, owner: mockUser });
      expect(tripRepository.save).toHaveBeenCalledWith(mockTrip);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create({ name: 'Test' }, 'invalid-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByShareToken', () => {
    it('should find trip by share token', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);

      const result = await service.findByShareToken('test-token-123');

      expect(result).toEqual(mockTrip);
      expect(tripRepository.findOne).toHaveBeenCalledWith({
        where: { shareToken: 'test-token-123', isPublic: true },
        relations: ['owner'],
      });
    });

    it('should throw NotFoundException if trip not found or not public', async () => {
      tripRepository.findOne.mockResolvedValue(null);

      await expect(service.findByShareToken('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('inviteParticipant', () => {
    it('should throw ForbiddenException if user cannot invite', async () => {
      const mockTripForInvite = { 
        ...mockTrip, 
        participants: [],
        generateShareToken: jest.fn(),
      };
      tripRepository.findOne.mockResolvedValue(mockTripForInvite);
      
      const inviteDto = { userId: 'user-2' };

      await expect(service.inviteParticipant('trip-1', inviteDto, 'unauthorized-user')).rejects.toThrow();
    });
  });

  describe('updateParticipantRole', () => {
    it('should throw ForbiddenException if user is not owner', async () => {
      const nonOwnerTrip = { 
        ...mockTrip, 
        owner: { ...mockUser, id: 'other-user' },
        generateShareToken: jest.fn(),
      };
      tripRepository.findOne.mockResolvedValue(nonOwnerTrip);

      await expect(service.updateParticipantRole('trip-1', 'participant-1', { role: 'admin' }, mockUser.id)).rejects.toThrow();
    });
  });
});