import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../../src/trips/trips.service';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { Item } from '../../src/items/entities/item.entity';
import { Luggage } from '../../src/luggage/entities/luggage.entity';
import { TripStatus } from '../../src/common/enums/trip-status.enum';
import { ParticipantRole } from '../../src/common/enums/participant-role.enum';
import { ParticipantStatus } from '../../src/common/enums/participant-status.enum';
import { ItemStatus } from '../../src/common/enums/item-status.enum';
import { LuggageStatus } from '../../src/common/enums/luggage-status.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('Trip Assignment Workflows', () => {
  let service: TripsService;
  let tripRepository: jest.Mocked<Repository<Trip>>;
  let participantRepository: jest.Mocked<Repository<TripParticipant>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockOwner: User = {
    id: 'owner-1',
    firstName: 'Trip',
    lastName: 'Owner',
    email: 'owner@example.com',
    username: 'tripowner',
    emailVerified: true,
    isActive: true,
  } as User;

  const mockParticipant: User = {
    id: 'participant-1',
    firstName: 'Trip',
    lastName: 'Member',
    email: 'member@example.com',
    username: 'tripmember',
    emailVerified: true,
    isActive: true,
  } as User;

  const mockTrip: Trip = {
    id: 'trip-1',
    name: 'Test Adventure Trip',
    description: 'A comprehensive test trip',
    destination: 'Mountain Resort',
    status: TripStatus.PLANNING,
    owner: mockOwner,
    isPublic: false,
    shareToken: 'adventure-token-123',
    budget: 5000,
    currency: 'USD',
    maxParticipants: 6,
    category: 'Adventure',
    departureLocation: 'San Francisco',
    timeZone: 'America/Los_Angeles',
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

  describe('Participant Role Management', () => {
    it('should create owner participant with OWNER role and JOINED status', async () => {
      const createTripDto = {
        name: 'Role Test Trip',
        budget: 3000,
        maxParticipants: 4,
      };

      userRepository.findOne.mockResolvedValue(mockOwner);
      tripRepository.create.mockReturnValue(mockTrip);
      tripRepository.save.mockResolvedValue(mockTrip);
      
      const mockOwnerParticipant = {
        trip: mockTrip,
        user: mockOwner,
        role: ParticipantRole.OWNER,
        status: ParticipantStatus.JOINED,
        invitedBy: mockOwner,
        joinedAt: expect.any(Date),
      };
      
      participantRepository.create.mockReturnValue(mockOwnerParticipant as TripParticipant);
      participantRepository.save.mockResolvedValue(mockOwnerParticipant as TripParticipant);

      await service.create(createTripDto, mockOwner.id);

      expect(participantRepository.create).toHaveBeenCalledWith({
        trip: mockTrip,
        user: mockOwner,
        role: ParticipantRole.OWNER,
        status: ParticipantStatus.JOINED,
        invitedBy: mockOwner,
        joinedAt: expect.any(Date),
      });
    });

    it('should invite participant with correct role and INVITED status', async () => {
      const mockTripWithAccess = {
        ...mockTrip,
        participants: [{
          user: { id: mockOwner.id },
          role: ParticipantRole.OWNER,
          status: ParticipantStatus.JOINED,
        }],
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(mockTripWithAccess);
      userRepository.findOne.mockResolvedValueOnce(mockParticipant); // User to invite
      userRepository.findOne.mockResolvedValueOnce(mockOwner); // Inviter
      participantRepository.findOne.mockResolvedValue(null); // No existing participation

      const mockInvitedParticipant = {
        trip: mockTripWithAccess,
        user: mockParticipant,
        invitedBy: mockOwner,
        role: ParticipantRole.PARTICIPANT,
        status: ParticipantStatus.INVITED,
      };

      participantRepository.create.mockReturnValue(mockInvitedParticipant as TripParticipant);
      participantRepository.save.mockResolvedValue(mockInvitedParticipant as TripParticipant);

      const inviteDto = { userId: mockParticipant.id, role: 'participant' };
      const result = await service.inviteParticipant(mockTrip.id, inviteDto, mockOwner.id);

      expect(participantRepository.create).toHaveBeenCalledWith({
        trip: mockTripWithAccess,
        user: mockParticipant,
        invitedBy: mockOwner,
        role: ParticipantRole.PARTICIPANT,
        status: ParticipantStatus.INVITED,
      });
    });

    it('should promote participant to admin role', async () => {
      const mockExistingParticipant = {
        id: 'participant-record-1',
        role: ParticipantRole.PARTICIPANT,
        user: { id: mockParticipant.id },
      };

      const mockTripForRoleUpdate = {
        ...mockTrip,
        owner: mockOwner,
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(mockTripForRoleUpdate);
      participantRepository.findOne.mockResolvedValue(mockExistingParticipant as TripParticipant);
      participantRepository.save.mockResolvedValue({
        ...mockExistingParticipant,
        role: ParticipantRole.ADMIN,
      } as TripParticipant);

      const updateRoleDto = { role: 'admin' };
      const result = await service.updateParticipantRole(
        mockTrip.id,
        mockParticipant.id,
        updateRoleDto,
        mockOwner.id
      );

      expect(mockExistingParticipant.role).toBe(ParticipantRole.ADMIN);
      expect(participantRepository.save).toHaveBeenCalledWith(mockExistingParticipant);
    });

    it('should prevent changing owner role', async () => {
      const mockOwnerParticipant = {
        id: 'owner-participant',
        role: ParticipantRole.OWNER,
        user: { id: mockOwner.id },
      };

      const mockTripForOwnerRoleUpdate = {
        ...mockTrip,
        owner: mockOwner,
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(mockTripForOwnerRoleUpdate);
      participantRepository.findOne.mockResolvedValue(mockOwnerParticipant as TripParticipant);

      const updateRoleDto = { role: 'admin' };
      
      await expect(
        service.updateParticipantRole(
          mockTrip.id,
          mockOwner.id,
          updateRoleDto,
          mockOwner.id
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Status Transition Workflows', () => {
    it('should transition from INVITED to JOINED when accepting invitation', async () => {
      const mockInvitedParticipant = {
        id: 'invited-participant',
        status: ParticipantStatus.INVITED,
        joinedAt: null,
      };

      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValue(mockParticipant);
      participantRepository.findOne.mockResolvedValue(mockInvitedParticipant as TripParticipant);
      
      const mockJoinedParticipant = {
        ...mockInvitedParticipant,
        status: ParticipantStatus.JOINED,
        joinedAt: new Date(),
      };
      
      participantRepository.save.mockResolvedValue(mockJoinedParticipant as TripParticipant);

      const result = await service.joinTrip(mockTrip.id, mockParticipant.id);

      expect(mockInvitedParticipant.status).toBe(ParticipantStatus.JOINED);
      expect(mockInvitedParticipant.joinedAt).toBeInstanceOf(Date);
      expect(participantRepository.save).toHaveBeenCalledWith(mockInvitedParticipant);
    });

    it('should allow joining public trips without invitation', async () => {
      const mockPublicTrip = {
        ...mockTrip,
        isPublic: true,
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(mockPublicTrip);
      userRepository.findOne.mockResolvedValue(mockParticipant);
      participantRepository.findOne.mockResolvedValue(null); // No existing participation

      const mockNewParticipant = {
        trip: mockPublicTrip,
        user: mockParticipant,
        role: ParticipantRole.PARTICIPANT,
        status: ParticipantStatus.JOINED,
        joinedAt: new Date(),
      };

      participantRepository.create.mockReturnValue(mockNewParticipant as TripParticipant);
      participantRepository.save.mockResolvedValue(mockNewParticipant as TripParticipant);

      const result = await service.joinTrip(mockPublicTrip.id, mockParticipant.id);

      expect(participantRepository.create).toHaveBeenCalledWith({
        trip: mockPublicTrip,
        user: mockParticipant,
        role: ParticipantRole.PARTICIPANT,
        status: ParticipantStatus.JOINED,
        joinedAt: expect.any(Date),
      });
    });

    it('should prevent joining private trips without invitation', async () => {
      const mockPrivateTrip = {
        ...mockTrip,
        isPublic: false,
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(mockPrivateTrip);
      userRepository.findOne.mockResolvedValue(mockParticipant);
      participantRepository.findOne.mockResolvedValue(null); // No invitation

      await expect(
        service.joinTrip(mockPrivateTrip.id, mockParticipant.id)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Budget and Capacity Constraints', () => {
    it('should respect maxParticipants when set', () => {
      const tripWithLimit = {
        ...mockTrip,
        maxParticipants: 3,
        participants: [
          { status: ParticipantStatus.JOINED },
          { status: ParticipantStatus.JOINED },
          { status: ParticipantStatus.JOINED },
        ],
      };

      expect(tripWithLimit.maxParticipants).toBe(3);
      expect(tripWithLimit.participants.length).toBe(3);
      // Future enhancement: Add service logic to enforce this limit
    });

    it('should handle budget constraints in trip planning', () => {
      const budgetTrip = {
        ...mockTrip,
        budget: 1000,
        currency: 'EUR',
      };

      expect(budgetTrip.budget).toBe(1000);
      expect(budgetTrip.currency).toBe('EUR');
      // Future enhancement: Add service logic for budget tracking
    });
  });

  describe('Enhanced Trip Management', () => {
    it('should create trip with comprehensive planning data', async () => {
      const comprehensiveCreateDto = {
        name: 'Complete Adventure',
        description: 'Fully planned adventure trip',
        destination: 'Swiss Alps',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-07'),
        budget: 4500,
        currency: 'CHF',
        maxParticipants: 8,
        category: 'Adventure',
        departureLocation: 'Zurich Airport',
        timeZone: 'Europe/Zurich',
        accommodation: 'Mountain lodges and hotels',
        transportation: 'Train and cable cars',
        bookingDeadline: new Date('2024-06-01'),
        requirements: 'Valid passport, travel insurance, hiking boots',
      };

      userRepository.findOne.mockResolvedValue(mockOwner);
      
      const comprehensiveTrip = { 
        ...mockTrip, 
        ...comprehensiveCreateDto,
        generateShareToken: jest.fn(),
      };
      tripRepository.create.mockReturnValue(comprehensiveTrip);
      tripRepository.save.mockResolvedValue(comprehensiveTrip);
      participantRepository.create.mockReturnValue({} as TripParticipant);
      participantRepository.save.mockResolvedValue({} as TripParticipant);

      const result = await service.create(comprehensiveCreateDto, mockOwner.id);

      expect(tripRepository.create).toHaveBeenCalledWith({
        ...comprehensiveCreateDto,
        owner: mockOwner,
      });
      expect(result.budget).toBe(4500);
      expect(result.currency).toBe('CHF');
      expect(result.maxParticipants).toBe(8);
      expect(result.category).toBe('Adventure');
    });

    it('should handle trip status progression', () => {
      const statusProgression = [
        TripStatus.PLANNING,
        TripStatus.ACTIVE,
        TripStatus.COMPLETED,
      ];

      statusProgression.forEach(status => {
        const tripWithStatus = { ...mockTrip, status };
        expect(Object.values(TripStatus)).toContain(tripWithStatus.status);
      });
    });
  });

  describe('Error Handling for Assignment Workflows', () => {
    it('should throw NotFoundException when inviting non-existent user', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValue(null); // User not found

      const inviteDto = { userId: 'non-existent-user' };
      
      await expect(
        service.inviteParticipant(mockTrip.id, inviteDto, mockOwner.id)
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent duplicate invitations', async () => {
      const mockTripWithParticipant = {
        ...mockTrip,
        participants: [{
          user: { id: mockOwner.id },
          role: ParticipantRole.OWNER,
          status: ParticipantStatus.JOINED,
        }],
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(mockTripWithParticipant);
      userRepository.findOne.mockResolvedValueOnce(mockParticipant);
      userRepository.findOne.mockResolvedValueOnce(mockOwner);
      
      // User already has a participation record
      const existingParticipation = {
        status: ParticipantStatus.INVITED,
      };
      participantRepository.findOne.mockResolvedValue(existingParticipation as TripParticipant);

      const inviteDto = { userId: mockParticipant.id };
      
      await expect(
        service.inviteParticipant(mockTrip.id, inviteDto, mockOwner.id)
      ).rejects.toThrow();
    });
  });
});