import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../../src/trips/trips.service';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('Participant Boundary Condition Tests', () => {
  let service: TripsService;
  let tripRepository: jest.Mocked<Repository<Trip>>;
  let participantRepository: jest.Mocked<Repository<TripParticipant>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockOwner: User = {
    id: 'owner-uuid',
    fullname: 'Trip Owner',
    email: 'owner@example.com',
    username: 'tripowner',
  } as User;

  const mockUser: User = {
    id: 'user-uuid',
    fullname: 'Test User',
    email: 'user@example.com',
    username: 'testuser',
  } as User;

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty and Null Value Handling', () => {
    it('should handle empty participant list correctly', async () => {
      const tripWithNoParticipants = {
        id: 'trip-uuid',
        name: 'Empty Trip',
        owner: mockOwner,
        participants: [],
        isPublic: true,
        status: 'planning',
        shareToken: 'test-token',
        createdAt: new Date(),
        updatedAt: new Date(),
        generateShareToken: jest.fn(),
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithNoParticipants);
      userRepository.findOne.mockResolvedValue(mockUser);
      participantRepository.findOne.mockResolvedValue(null);

      const newParticipant = {
        id: 'first-participant',
        trip: tripWithNoParticipants,
        user: mockUser,
        role: 'participant',
        status: 'joined',
        joinedAt: new Date(),
      } as TripParticipant;

      participantRepository.create.mockReturnValue(newParticipant);
      participantRepository.save.mockResolvedValue(newParticipant);

      const result = await service.joinTrip('trip-uuid', mockUser.id);
      expect(result).toEqual(newParticipant);
    });

    it('should handle null invitedBy field gracefully', async () => {
      const tripWithOwner = {
        id: 'trip-uuid',
        owner: mockOwner,
        participants: [],
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithOwner);
      userRepository.findOne
        .mockResolvedValueOnce(mockOwner) // Inviter
        .mockResolvedValueOnce(mockUser); // User to invite
      participantRepository.findOne.mockResolvedValue(null);

      const participantWithoutInviter = {
        id: 'participant-uuid',
        trip: tripWithOwner,
        user: mockUser,
        role: 'participant',
        status: 'invited',
        invitedBy: null, // Edge case: null inviter
      } as TripParticipant;

      participantRepository.create.mockReturnValue(participantWithoutInviter);
      participantRepository.save.mockResolvedValue(participantWithoutInviter);

      // Should still work even with null inviter
      const result = await service.inviteParticipant(
        'trip-uuid',
        { userId: mockUser.id, role: 'participant' },
        mockOwner.id
      );

      expect(result).toEqual(participantWithoutInviter);
    });
  });

  describe('Status Transition Edge Cases', () => {
    it('should handle all possible status transitions correctly', async () => {
      const trip = { 
        id: 'trip-uuid', 
        name: 'Test Trip',
        owner: mockOwner, 
        status: 'planning',
        isPublic: false,
        shareToken: 'test-token',
        participants: [],
        currency: 'USD',
        luggage: [],
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        generateShareToken: jest.fn() 
      } as Trip;
      tripRepository.findOne.mockResolvedValue(trip);
      userRepository.findOne.mockResolvedValue(mockUser);

      // Test invited → joined transition
      const invitedParticipant = {
        id: 'participant-uuid',
        trip,
        user: mockUser,
        role: 'participant',
        status: 'invited',
      } as TripParticipant;

      participantRepository.findOne.mockResolvedValue(invitedParticipant);
      
      const joinedParticipant = {
        ...invitedParticipant,
        status: 'joined',
        joinedAt: new Date(),
      };
      
      participantRepository.save.mockResolvedValue(joinedParticipant);

      const result = await service.joinTrip('trip-uuid', mockUser.id);
      expect(result.status).toBe('joined');
      expect(result.joinedAt).toBeDefined();
    });

    it('should handle rejoining after "left" status', async () => {
      const publicTrip = {
        id: 'trip-uuid',
        name: 'Public Trip',
        owner: mockOwner,
        status: 'planning',
        shareToken: 'test-token',
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        generateShareToken: jest.fn(),
      } as Trip;

      tripRepository.findOne.mockResolvedValue(publicTrip);
      userRepository.findOne.mockResolvedValue(mockUser);

      // Mock user who has "left" status
      const leftParticipant = {
        id: 'left-participant',
        trip: publicTrip,
        user: mockUser,
        status: 'left',
        leftAt: new Date(),
      } as TripParticipant;

      participantRepository.findOne.mockResolvedValue(leftParticipant);

      // Should create new participation record
      const newParticipant = {
        id: 'new-participation',
        trip: publicTrip,
        user: mockUser,
        role: 'participant',
        status: 'joined',
        joinedAt: new Date(),
      } as TripParticipant;

      participantRepository.create.mockReturnValue(newParticipant);
      participantRepository.save.mockResolvedValue(newParticipant);

      const result = await service.joinTrip('trip-uuid', mockUser.id);
      expect(result.status).toBe('joined');
    });
  });

  describe('Role Boundary Conditions', () => {
    it('should handle role validation edge cases', async () => {
      const trip = {
        id: 'trip-uuid',
        owner: mockOwner,
        participants: [],
      } as Trip;

      tripRepository.findOne.mockResolvedValue(trip);
      userRepository.findOne
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(mockUser);
      participantRepository.findOne.mockResolvedValue(null);

      // Test default role assignment when none specified
      const inviteDto = { userId: mockUser.id }; // No role specified

      const participantWithDefaultRole = {
        id: 'participant-uuid',
        trip,
        user: mockUser,
        role: 'participant', // Should default to 'participant'
        status: 'invited',
        invitedBy: mockOwner,
      } as TripParticipant;

      participantRepository.create.mockReturnValue(participantWithDefaultRole);
      participantRepository.save.mockResolvedValue(participantWithDefaultRole);

      const result = await service.inviteParticipant('trip-uuid', inviteDto, mockOwner.id);
      expect(result.role).toBe('participant');
    });

    it('should preserve role hierarchy constraints', async () => {
      const trip = {
        id: 'trip-uuid',
        owner: mockOwner,
      } as Trip;

      tripRepository.findOne.mockResolvedValue(trip);

      // Test that owner role cannot be assigned to other users
      const ownerParticipant = {
        id: 'owner-participant',
        user: mockOwner,
        role: 'owner',
        status: 'joined',
        trip,
      } as TripParticipant;

      participantRepository.findOne.mockResolvedValue(ownerParticipant);

      // Should prevent changing owner role
      await expect(
        service.updateParticipantRole('trip-uuid', mockOwner.id, { role: 'participant' }, mockOwner.id)
      ).rejects.toThrow();
    });
  });

  describe('Date and Time Boundary Conditions', () => {
    it('should handle date fields correctly on join/leave operations', async () => {
      const trip = { 
        id: 'trip-uuid', 
        name: 'Test Trip',
        owner: mockOwner, 
        status: 'planning',
        isPublic: false,
        shareToken: 'test-token',
        participants: [],
        currency: 'USD',
        luggage: [],
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        generateShareToken: jest.fn() 
      } as Trip;
      const currentTime = new Date();

      // Test join operation with date
      tripRepository.findOne.mockResolvedValue(trip);
      userRepository.findOne.mockResolvedValue(mockUser);

      const invitedParticipant = {
        id: 'participant-uuid',
        trip,
        user: mockUser,
        role: 'participant',
        status: 'invited',
        invitedAt: new Date(currentTime.getTime() - 3600000), // 1 hour ago
        invitedBy: mockOwner,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;

      participantRepository.findOne.mockResolvedValue(invitedParticipant);

      const joinedParticipant = {
        ...invitedParticipant,
        status: 'joined',
        joinedAt: currentTime,
      };

      participantRepository.save.mockResolvedValue(joinedParticipant);

      const joinResult = await service.joinTrip('trip-uuid', mockUser.id);
      
      expect(joinResult.joinedAt).toBeDefined();
      expect(joinResult.joinedAt.getTime()).toBeGreaterThanOrEqual(currentTime.getTime() - 1000);
    });

    it('should handle future start dates for leave policy', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days in future

      const tripWithFutureStart = {
        id: 'trip-uuid',
        owner: mockOwner,
        startDate: futureDate,
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithFutureStart);

      const participantToLeave = {
        id: 'participant-uuid',
        trip: tripWithFutureStart,
        user: mockUser,
        role: 'participant',
        status: 'joined',
      } as TripParticipant;

      participantRepository.findOne.mockResolvedValue(participantToLeave);
      participantRepository.remove.mockResolvedValue(undefined);

      await service.leaveTrip('trip-uuid', mockUser.id);

      // Should still process the leave operation
      expect(participantRepository.remove).toHaveBeenCalledWith(participantToLeave);
    });
  });

  describe('Permission Edge Cases', () => {
    it('should handle complex permission scenarios', async () => {
      // Test scenario where user is both owner and participant
      const tripWithOwnerAsParticipant = {
        id: 'trip-uuid',
        owner: mockOwner,
        participants: [
          {
            user: mockOwner,
            role: 'owner',
            status: 'joined',
          }
        ],
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithOwnerAsParticipant);

      // Owner should have access
      const result = await service.findOne('trip-uuid', mockOwner.id);
      expect(result).toBeDefined();
    });

    it('should handle permission checks with multiple admin participants', async () => {
      const tripWithMultipleAdmins = {
        id: 'trip-uuid',
        owner: mockOwner,
        participants: [
          {
            user: { id: 'admin1' },
            role: 'admin',
            status: 'joined',
          },
          {
            user: { id: 'admin2' },
            role: 'admin',
            status: 'joined',
          },
          {
            user: mockUser,
            role: 'participant',
            status: 'joined',
          }
        ],
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithMultipleAdmins);
      userRepository.findOne
        .mockResolvedValueOnce({ id: 'admin1' } as User)
        .mockResolvedValueOnce(mockUser);
      participantRepository.findOne.mockResolvedValue(null);

      const newParticipant = {
        id: 'invited-by-admin',
        trip: tripWithMultipleAdmins,
        user: mockUser,
        role: 'participant',
        status: 'invited',
      } as TripParticipant;

      participantRepository.create.mockReturnValue(newParticipant);
      participantRepository.save.mockResolvedValue(newParticipant);

      // Admin1 should be able to invite
      const result = await service.inviteParticipant(
        'trip-uuid',
        { userId: mockUser.id, role: 'participant' },
        'admin1'
      );

      expect(result).toEqual(newParticipant);
    });
  });

  describe('Data Integrity Boundary Conditions', () => {
    it('should handle malformed participant data gracefully', async () => {
      const trip = { 
        id: 'trip-uuid', 
        name: 'Test Trip',
        owner: mockOwner, 
        status: 'planning',
        isPublic: false,
        shareToken: 'test-token',
        participants: [],
        currency: 'USD',
        luggage: [],
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        generateShareToken: jest.fn() 
      } as Trip;
      tripRepository.findOne.mockResolvedValue(trip);

      // Test with no participant found (common edge case)
      participantRepository.findOne.mockResolvedValue(null);

      // Should throw NotFoundException when participant is not found
      await expect(
        service.leaveTrip('trip-uuid', 'some-user-id')
      ).rejects.toThrow('Participation not found');
    });

    it('should validate UUID format boundaries', async () => {
      const trip = { 
        id: 'trip-uuid', 
        name: 'Test Trip',
        owner: mockOwner, 
        status: 'planning',
        isPublic: false,
        shareToken: 'test-token',
        participants: [],
        currency: 'USD',
        luggage: [],
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        generateShareToken: jest.fn() 
      } as Trip;
      tripRepository.findOne.mockResolvedValue(trip);
      
      // This would typically be caught by validation pipes in the controller
      // But service should handle edge cases gracefully
      const invalidUUIDs = [
        '', // Empty string
        'not-a-uuid', // Invalid format
        '123', // Too short
        '12345678-1234-1234-1234-123456789012', // Valid format but non-existent
      ];

      for (const invalidUUID of invalidUUIDs) {
        userRepository.findOne.mockResolvedValue(null);
        
        await expect(
          service.joinTrip('trip-uuid', invalidUUID)
        ).rejects.toThrow();
      }
    });
  });

  describe('Concurrent Operation Boundaries', () => {
    it('should handle rapid successive operations on same participant', async () => {
      const trip = { id: 'trip-uuid', owner: mockOwner, isPublic: true } as Trip;
      tripRepository.findOne.mockResolvedValue(trip);
      userRepository.findOne.mockResolvedValue(mockUser);

      // Simulate rapid join attempts
      participantRepository.findOne
        .mockResolvedValueOnce(null) // First call: no existing participant
        .mockResolvedValueOnce({ // Second call: participant exists (race condition)
          id: 'existing-participant',
          status: 'joined',
        } as TripParticipant);

      const newParticipant = {
        id: 'new-participant',
        trip,
        user: mockUser,
        role: 'participant',
        status: 'joined',
        joinedAt: new Date(),
      } as TripParticipant;

      participantRepository.create.mockReturnValue(newParticipant);
      participantRepository.save.mockResolvedValue(newParticipant);

      // First join should succeed
      const result = await service.joinTrip('trip-uuid', mockUser.id);
      expect(result).toEqual(newParticipant);
    });
  });

  describe('System Resource Boundaries', () => {
    it('should handle large participant lists efficiently', async () => {
      // Generate a large number of participants to test performance boundaries
      const manyParticipants = Array.from({ length: 100 }, (_, i) => ({
        user: { id: `user-${i}` },
        role: i === 0 ? 'owner' : 'participant',
        status: 'joined',
      }));

      const tripWithManyParticipants = {
        id: 'trip-uuid',
        owner: mockOwner,
        participants: manyParticipants,
      } as Trip;

      tripRepository.findOne.mockResolvedValue(tripWithManyParticipants);

      // Should still handle permission checks efficiently
      const result = await service.findOne('trip-uuid', 'user-50');
      expect(result).toBeDefined();
    });
  });
});