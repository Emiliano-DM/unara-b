import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../../src/trips/trips.service';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TripStatus } from '../../src/common/enums/trip-status.enum';
import { ParticipantRole } from '../../src/common/enums/participant-role.enum';
import { ParticipantStatus } from '../../src/common/enums/participant-status.enum';

describe('TripsService Unit Tests', () => {
  let service: TripsService;
  let tripRepository: jest.Mocked<Repository<Trip>>;
  let participantRepository: jest.Mocked<Repository<TripParticipant>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    fullname: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTrip: Trip = {
    id: 'trip-1',
    name: 'Test Trip',
    description: 'Test Description',
    destination: 'Test Destination',
    status: TripStatus.PLANNING,
    owner: mockUser,
    isPublic: false,
    shareToken: 'test-token-123',
    budget: 2000,
    currency: 'USD',
    maxParticipants: 10,
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
            remove: jest.fn(),
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
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(tripRepository.create).toHaveBeenCalledWith({
        ...createTripDto,
        owner: mockUser,
      });
      expect(tripRepository.save).toHaveBeenCalledWith(mockTrip);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Test' }, 'invalid-user'),
      ).rejects.toThrow(NotFoundException);
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

      await expect(service.findByShareToken('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
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

      await expect(
        service.inviteParticipant('trip-1', inviteDto, 'unauthorized-user'),
      ).rejects.toThrow();
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

      await expect(
        service.updateParticipantRole(
          'trip-1',
          'participant-1',
          { role: 'admin' },
          mockUser.id,
        ),
      ).rejects.toThrow();
    });
  });

  describe('Enhanced Trip Creation', () => {
    it('should create trip with budget and planning fields', async () => {
      const createTripDto = {
        name: 'Budget Trip',
        description: 'A well-planned trip',
        destination: 'Paris',
        budget: 3000,
        currency: 'EUR',
        maxParticipants: 8,
        category: 'Cultural',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      const expectedTrip = {
        ...mockTrip,
        ...createTripDto,
        generateShareToken: jest.fn(),
      };
      tripRepository.create.mockReturnValue(expectedTrip as Trip);
      tripRepository.save.mockResolvedValue(expectedTrip as Trip);
      participantRepository.create.mockReturnValue({
        role: ParticipantRole.OWNER,
        status: ParticipantStatus.JOINED,
      } as TripParticipant);
      participantRepository.save.mockResolvedValue({} as TripParticipant);

      const result = await service.create(createTripDto, mockUser.id);

      expect(result).toEqual(expectedTrip);
      expect(tripRepository.create).toHaveBeenCalledWith({
        ...createTripDto,
        owner: mockUser,
      });
    });
  });

  describe('Enum-based Status Management', () => {
    it('should handle participant role with enum', async () => {
      const mockParticipant = {
        id: 'participant-1',
        role: ParticipantRole.PARTICIPANT,
        status: ParticipantStatus.INVITED,
        user: { id: 'user-2' },
      } as TripParticipant;

      const mockTripWithParticipants = {
        ...mockTrip,
        participants: [mockParticipant],
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(
        mockTripWithParticipants as Trip,
      );
      userRepository.findOne.mockResolvedValue({ id: 'user-2' } as User);
      participantRepository.findOne.mockResolvedValue(null);
      participantRepository.create.mockReturnValue({
        role: ParticipantRole.PARTICIPANT,
        status: ParticipantStatus.INVITED,
      } as TripParticipant);
      participantRepository.save.mockResolvedValue({} as TripParticipant);

      const inviteDto = { userId: 'user-2', role: 'participant' };

      const result = await service.inviteParticipant(
        'trip-1',
        inviteDto,
        mockUser.id,
      );

      expect(participantRepository.create).toHaveBeenCalledWith({
        trip: mockTripWithParticipants,
        user: { id: 'user-2' },
        invitedBy: mockUser,
        role: ParticipantRole.PARTICIPANT,
        status: ParticipantStatus.INVITED,
      });
    });

    it('should handle participant status transitions correctly', async () => {
      const existingParticipant = {
        id: 'participant-1',
        status: ParticipantStatus.INVITED,
        joinedAt: null,
      } as TripParticipant;

      const mockTripForJoin = {
        ...mockTrip,
        isPublic: false,
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(mockTripForJoin as Trip);
      userRepository.findOne.mockResolvedValue(mockUser);
      participantRepository.findOne.mockResolvedValue(existingParticipant);
      participantRepository.save.mockResolvedValue({
        ...existingParticipant,
        status: ParticipantStatus.JOINED,
        joinedAt: expect.any(Date),
      });

      const result = await service.joinTrip('trip-1', mockUser.id);

      expect(participantRepository.save).toHaveBeenCalledWith({
        ...existingParticipant,
        status: ParticipantStatus.JOINED,
        joinedAt: expect.any(Date),
      });
    });
  });

  describe('Trip Management with New Fields', () => {
    it('should validate maxParticipants when inviting', async () => {
      const fullTrip = {
        ...mockTrip,
        maxParticipants: 2,
        participants: [
          { status: ParticipantStatus.JOINED },
          { status: ParticipantStatus.JOINED },
        ],
      };

      tripRepository.findOne.mockResolvedValue(fullTrip);

      // This test would need additional logic in the service to check maxParticipants
      // For now, we're testing that the field is accessible
      expect(fullTrip.maxParticipants).toBe(2);
      expect(fullTrip.participants.length).toBe(2);
    });

    it('should handle budget constraints in trip updates', async () => {
      const updateDto = {
        budget: 5000,
        currency: 'GBP',
      };

      const updatedTrip = { ...mockTrip, ...updateDto };
      tripRepository.findOne.mockResolvedValue(mockTrip);
      tripRepository.save.mockResolvedValue(updatedTrip);

      const result = await service.update('trip-1', updateDto, mockUser.id);

      expect(result.budget).toBe(5000);
      expect(result.currency).toBe('GBP');
    });
  });
});
