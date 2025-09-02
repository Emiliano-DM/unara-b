import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../../src/trips/trips.service';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';

describe('Participant Workflow Integration Tests', () => {
  let service: TripsService;
  let tripRepository: jest.Mocked<Repository<Trip>>;
  let participantRepository: jest.Mocked<Repository<TripParticipant>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockOwner: User = {
    id: 'owner-uuid',
    fullname: 'Trip Owner',
    email: 'owner@example.com',
    username: 'tripowner',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockUser1: User = {
    id: 'user1-uuid',
    fullname: 'User One',
    email: 'user1@example.com',
    username: 'user1',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockUser2: User = {
    id: 'user2-uuid',
    fullname: 'User Two',
    email: 'user2@example.com',
    username: 'user2',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  let mockTrip: Trip;

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

    // Reset mockTrip for each test
    mockTrip = {
      id: 'trip-uuid',
      name: 'Test Trip',
      description: 'Test Description',
      destination: 'Test Destination',
      status: 'planning',
      owner: mockOwner,
      isPublic: false,
      shareToken: 'test-token-123',
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      generateShareToken: jest.fn(),
    } as Trip;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Trip Creation with Owner Participant', () => {
    it('should create trip and automatically add owner as participant', async () => {
      const createTripDto = {
        name: 'Family Vacation',
        description: 'Annual family trip',
        destination: 'Hawaii',
      };

      // Mock user lookup for owner
      userRepository.findOne.mockResolvedValue(mockOwner);

      // Mock trip creation
      const newTrip = {
        ...mockTrip,
        ...createTripDto,
        generateShareToken: jest.fn(),
      };
      tripRepository.create.mockReturnValue(newTrip);
      tripRepository.save.mockResolvedValue(newTrip);

      // Mock owner participant creation
      const ownerParticipant = {
        id: 'owner-participant-uuid',
        trip: newTrip,
        user: mockOwner,
        role: 'owner',
        status: 'joined',
        invitedBy: mockOwner,
        joinedAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      participantRepository.create.mockReturnValue(ownerParticipant);
      participantRepository.save.mockResolvedValue(ownerParticipant);

      const result = await service.create(createTripDto, mockOwner.id);

      expect(result).toEqual(newTrip);
      expect(tripRepository.create).toHaveBeenCalledWith({
        ...createTripDto,
        owner: mockOwner,
      });
      expect(participantRepository.create).toHaveBeenCalledWith({
        trip: newTrip,
        user: mockOwner,
        role: 'owner',
        status: 'joined',
        invitedBy: mockOwner,
        joinedAt: expect.any(Date),
      });
    });
  });

  describe('Multi-User Invitation Workflow', () => {
    it('should handle inviting multiple users with different roles', async () => {
      // Setup trip with owner participant
      const tripWithOwner = {
        ...mockTrip,
        participants: [
          {
            user: mockOwner,
            role: 'owner',
            status: 'joined',
          },
        ],
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithOwner);

      // Test inviting user1 as admin
      userRepository.findOne
        .mockResolvedValueOnce(mockOwner) // Inviter verification
        .mockResolvedValueOnce(mockUser1); // User to invite
      participantRepository.findOne.mockResolvedValue(null); // No existing participant

      const user1Participant = {
        id: 'user1-participant',
        trip: tripWithOwner,
        user: mockUser1,
        role: 'admin',
        status: 'invited',
        invitedBy: mockOwner,
      } as TripParticipant;

      participantRepository.create.mockReturnValue(user1Participant);
      participantRepository.save.mockResolvedValue(user1Participant);

      const inviteResult1 = await service.inviteParticipant(
        'trip-uuid',
        { userId: mockUser1.id, role: 'admin' },
        mockOwner.id,
      );

      expect(inviteResult1.role).toBe('admin');
      expect(inviteResult1.status).toBe('invited');

      // Test inviting user2 as participant
      userRepository.findOne
        .mockResolvedValueOnce(mockOwner) // Inviter verification
        .mockResolvedValueOnce(mockUser2); // User to invite

      const user2Participant = {
        id: 'user2-participant',
        trip: tripWithOwner,
        user: mockUser2,
        role: 'participant',
        status: 'invited',
        invitedBy: mockOwner,
      } as TripParticipant;

      participantRepository.create.mockReturnValue(user2Participant);
      participantRepository.save.mockResolvedValue(user2Participant);

      const inviteResult2 = await service.inviteParticipant(
        'trip-uuid',
        { userId: mockUser2.id, role: 'participant' },
        mockOwner.id,
      );

      expect(inviteResult2.role).toBe('participant');
      expect(inviteResult2.status).toBe('invited');
    });
  });

  describe('Invitation Acceptance Workflow', () => {
    it('should handle user accepting invitation and joining trip', async () => {
      // Setup trip
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValue(mockUser1);

      // Mock existing invitation
      const existingInvitation = {
        id: 'invitation-uuid',
        trip: mockTrip,
        user: mockUser1,
        role: 'participant',
        status: 'invited',
        invitedBy: mockOwner,
      } as TripParticipant;

      participantRepository.findOne.mockResolvedValue(existingInvitation);

      // Mock joining the trip
      const joinedParticipant = {
        ...existingInvitation,
        status: 'joined',
        joinedAt: new Date(),
      };

      participantRepository.save.mockResolvedValue(joinedParticipant);

      const result = await service.joinTrip('trip-uuid', mockUser1.id);

      expect(result.status).toBe('joined');
      expect(result.joinedAt).toBeDefined();
      expect(participantRepository.save).toHaveBeenCalledWith({
        ...existingInvitation,
        status: 'joined',
        joinedAt: expect.any(Date),
      });
    });
  });

  describe('Public Trip Join Workflow', () => {
    it('should allow users to join public trips without invitation', async () => {
      const publicTrip = {
        ...mockTrip,
        isPublic: true,
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(publicTrip);
      userRepository.findOne.mockResolvedValue(mockUser1);
      participantRepository.findOne.mockResolvedValue(null); // No existing participation

      const newParticipant = {
        id: 'new-participant',
        trip: publicTrip,
        user: mockUser1,
        role: 'participant',
        status: 'joined',
        joinedAt: new Date(),
        invitedBy: mockOwner,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      participantRepository.create.mockReturnValue(newParticipant);
      participantRepository.save.mockResolvedValue(newParticipant);

      const result = await service.joinTrip('trip-uuid', mockUser1.id);

      expect(result.status).toBe('joined');
      expect(result.role).toBe('participant');
      expect(participantRepository.create).toHaveBeenCalledWith({
        trip: publicTrip,
        user: mockUser1,
        role: 'participant',
        status: 'joined',
        joinedAt: expect.any(Date),
      });
    });
  });

  describe('Role Management Workflow', () => {
    it('should handle promoting participant to admin and back', async () => {
      // Setup trip with participants
      const tripWithParticipants = {
        ...mockTrip,
        participants: [
          {
            user: mockOwner,
            role: 'owner',
            status: 'joined',
          },
          {
            user: mockUser1,
            role: 'participant',
            status: 'joined',
          },
        ],
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithParticipants);

      // Mock finding participant to promote
      const participantToPromote = {
        id: 'participant-to-promote',
        user: mockUser1,
        role: 'participant',
        status: 'joined',
        trip: tripWithParticipants,
      } as TripParticipant;

      participantRepository.findOne.mockResolvedValue(participantToPromote);

      // Test promotion to admin
      const promotedParticipant = { ...participantToPromote, role: 'admin' };
      participantRepository.save.mockResolvedValue(promotedParticipant);

      const promoteResult = await service.updateParticipantRole(
        'trip-uuid',
        mockUser1.id,
        { role: 'admin' },
        mockOwner.id,
      );

      expect(promoteResult.role).toBe('admin');

      // Test demotion back to participant
      const demotedParticipant = {
        ...promotedParticipant,
        role: 'participant',
      };
      participantRepository.save.mockResolvedValue(demotedParticipant);

      const demoteResult = await service.updateParticipantRole(
        'trip-uuid',
        mockUser1.id,
        { role: 'participant' },
        mockOwner.id,
      );

      expect(demoteResult.role).toBe('participant');
    });
  });

  describe('Admin Delegation Workflow', () => {
    it('should allow admin to invite others after being promoted', async () => {
      // Setup trip with admin user
      const tripWithAdmin = {
        ...mockTrip,
        participants: [
          {
            user: mockOwner,
            role: 'owner',
            status: 'joined',
          },
          {
            user: mockUser1,
            role: 'admin', // user1 is now admin
            status: 'joined',
          },
        ],
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithAdmin);
      userRepository.findOne
        .mockResolvedValueOnce(mockUser1) // Admin inviter
        .mockResolvedValueOnce(mockUser2); // User to invite
      participantRepository.findOne.mockResolvedValue(null); // No existing participant

      const invitedParticipant = {
        id: 'invited-by-admin',
        trip: tripWithAdmin,
        user: mockUser2,
        role: 'participant',
        status: 'invited',
        invitedBy: mockUser1, // Invited by admin, not owner
      } as TripParticipant;

      participantRepository.create.mockReturnValue(invitedParticipant);
      participantRepository.save.mockResolvedValue(invitedParticipant);

      const result = await service.inviteParticipant(
        'trip-uuid',
        { userId: mockUser2.id, role: 'participant' },
        mockUser1.id, // Admin is doing the inviting
      );

      expect(result.invitedBy).toBe(mockUser1);
      expect(result.status).toBe('invited');
    });
  });

  describe('Leave and Rejoin Workflow', () => {
    it('should handle user leaving and then rejoining public trip', async () => {
      const publicTrip = {
        ...mockTrip,
        isPublic: true,
        generateShareToken: jest.fn(),
      };

      // First, simulate leaving
      tripRepository.findOne.mockResolvedValue(publicTrip);

      const participantToRemove = {
        id: 'participant-to-remove',
        trip: publicTrip,
        user: mockUser1,
        role: 'participant',
        status: 'joined',
        invitedBy: mockOwner,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      participantRepository.findOne.mockResolvedValue(participantToRemove);
      participantRepository.remove.mockResolvedValue(undefined);

      await service.leaveTrip('trip-uuid', mockUser1.id);

      expect(participantRepository.remove).toHaveBeenCalledWith(
        participantToRemove,
      );

      // Then simulate rejoining
      userRepository.findOne.mockResolvedValue(mockUser1);
      participantRepository.findOne.mockResolvedValue(null); // No existing participation after leaving

      const rejoinParticipant = {
        id: 'rejoin-participant',
        trip: publicTrip,
        user: mockUser1,
        role: 'participant',
        status: 'joined',
        joinedAt: new Date(),
        invitedBy: mockOwner,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      participantRepository.create.mockReturnValue(rejoinParticipant);
      participantRepository.save.mockResolvedValue(rejoinParticipant);

      const rejoinResult = await service.joinTrip('trip-uuid', mockUser1.id);

      expect(rejoinResult.status).toBe('joined');
      expect(rejoinResult.user).toBe(mockUser1);
    });
  });

  describe('Permission Cascading Workflow', () => {
    it('should verify permissions cascade correctly through participant operations', async () => {
      // Test that participant access works after joining
      const tripWithJoinedParticipant = {
        ...mockTrip,
        participants: [
          {
            user: mockUser1,
            status: 'joined',
          },
        ],
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithJoinedParticipant);

      // Should allow access to joined participant
      const result = await service.findOne('trip-uuid', mockUser1.id);
      expect(result).toBeDefined();

      // Test that access is revoked after leaving
      const tripAfterLeaving = {
        ...mockTrip,
        participants: [], // User has left
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripAfterLeaving);

      // Should deny access after leaving
      await expect(
        service.findOne('trip-uuid', mockUser1.id),
      ).rejects.toThrow();
    });
  });

  describe('Complex Multi-Step Scenarios', () => {
    it('should handle full lifecycle: invite → join → promote → demote → leave', async () => {
      let currentParticipant: TripParticipant;

      // Step 1: Invite user
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(mockUser1);
      participantRepository.findOne.mockResolvedValue(null);

      currentParticipant = {
        id: 'lifecycle-participant',
        trip: mockTrip,
        user: mockUser1,
        role: 'participant',
        status: 'invited',
        invitedBy: mockOwner,
      } as TripParticipant;

      participantRepository.create.mockReturnValue(currentParticipant);
      participantRepository.save.mockResolvedValue(currentParticipant);

      const inviteResult = await service.inviteParticipant(
        'trip-uuid',
        { userId: mockUser1.id, role: 'participant' },
        mockOwner.id,
      );
      expect(inviteResult.status).toBe('invited');

      // Step 2: Join trip
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValue(mockUser1);
      participantRepository.findOne.mockResolvedValue(currentParticipant);

      currentParticipant = {
        ...currentParticipant,
        status: 'joined',
        joinedAt: new Date(),
      };
      participantRepository.save.mockResolvedValue(currentParticipant);

      const joinResult = await service.joinTrip('trip-uuid', mockUser1.id);
      expect(joinResult.status).toBe('joined');

      // Step 3: Promote to admin
      tripRepository.findOne.mockResolvedValue(mockTrip);
      participantRepository.findOne.mockResolvedValue(currentParticipant);

      currentParticipant = { ...currentParticipant, role: 'admin' };
      participantRepository.save.mockResolvedValue(currentParticipant);

      const promoteResult = await service.updateParticipantRole(
        'trip-uuid',
        mockUser1.id,
        { role: 'admin' },
        mockOwner.id,
      );
      expect(promoteResult.role).toBe('admin');

      // Step 4: Demote back to participant
      participantRepository.findOne.mockResolvedValue(currentParticipant);

      currentParticipant = { ...currentParticipant, role: 'participant' };
      participantRepository.save.mockResolvedValue(currentParticipant);

      const demoteResult = await service.updateParticipantRole(
        'trip-uuid',
        mockUser1.id,
        { role: 'participant' },
        mockOwner.id,
      );
      expect(demoteResult.role).toBe('participant');

      // Step 5: Leave trip
      tripRepository.findOne.mockResolvedValue(mockTrip);
      participantRepository.findOne.mockResolvedValue(currentParticipant);
      participantRepository.remove.mockResolvedValue(undefined);

      await service.leaveTrip('trip-uuid', mockUser1.id);
      expect(participantRepository.remove).toHaveBeenCalledWith(
        currentParticipant,
      );
    });
  });
});
