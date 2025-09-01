import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../../src/trips/trips.service';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('Participant Edge Cases and Regression Tests', () => {
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

  const mockUser: User = {
    id: 'user-uuid',
    fullname: 'Test User',
    email: 'user@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTrip: Trip = {
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

  describe('inviteParticipant edge cases', () => {
    it('should prevent inviting non-existent user', async () => {
      const inviteDto = { userId: 'non-existent-user', role: 'participant' };
      
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValueOnce(mockOwner); // For permission check
      userRepository.findOne.mockResolvedValueOnce(null); // User to invite doesn't exist
      
      await expect(
        service.inviteParticipant('trip-uuid', inviteDto, mockOwner.id)
      ).rejects.toThrow(NotFoundException);
      
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 'non-existent-user' } });
    });

    it('should prevent self-invitation by owner', async () => {
      const inviteDto = { userId: mockOwner.id, role: 'participant' };
      
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValue(mockOwner);
      participantRepository.findOne.mockResolvedValue({
        id: 'existing-owner-participant',
        role: 'owner',
        status: 'joined',
      } as TripParticipant);
      
      await expect(
        service.inviteParticipant('trip-uuid', inviteDto, mockOwner.id)
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow re-inviting user who left the trip', async () => {
      const inviteDto = { userId: mockUser.id, role: 'participant' };
      
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValueOnce(mockOwner); // Inviter
      userRepository.findOne.mockResolvedValueOnce(mockUser); // User to invite
      
      // Mock user who previously left
      participantRepository.findOne.mockResolvedValue({
        id: 'left-participant',
        status: 'left',
        role: 'participant',
      } as TripParticipant);
      
      const newParticipant = {
        id: 'new-invitation',
        trip: mockTrip,
        user: mockUser,
        role: 'participant',
        status: 'invited',
      } as TripParticipant;
      
      participantRepository.create.mockReturnValue(newParticipant);
      participantRepository.save.mockResolvedValue(newParticipant);
      
      const result = await service.inviteParticipant('trip-uuid', inviteDto, mockOwner.id);
      
      expect(result).toEqual(newParticipant);
      expect(participantRepository.create).toHaveBeenCalled();
    });

    it('should prevent regular participant from inviting others', async () => {
      const tripWithParticipant = {
        ...mockTrip,
        participants: [{
          user: { id: 'regular-participant-id' },
          role: 'participant',
          status: 'joined',
        }],
      } as Trip;
      
      const inviteDto = { userId: mockUser.id, role: 'participant' };
      
      tripRepository.findOne.mockResolvedValue(tripWithParticipant);
      
      await expect(
        service.inviteParticipant('trip-uuid', inviteDto, 'regular-participant-id')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('joinTrip edge cases', () => {
    it('should handle joining public trip when user already has "left" status', async () => {
      const publicTrip = { ...mockTrip, isPublic: true, generateShareToken: jest.fn() };
      
      tripRepository.findOne.mockResolvedValue(publicTrip);
      userRepository.findOne.mockResolvedValue(mockUser);
      
      // Mock existing "left" participation
      const leftParticipant = {
        id: 'left-participant',
        trip: publicTrip,
        user: mockUser,
        role: 'participant',
        status: 'left',
        invitedBy: mockOwner,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TripParticipant;
      
      participantRepository.findOne.mockResolvedValue(leftParticipant);
      
      const newParticipant = {
        ...leftParticipant,
        status: 'joined',
        joinedAt: new Date(),
      };
      
      participantRepository.create.mockReturnValue(newParticipant);
      participantRepository.save.mockResolvedValue(newParticipant);
      
      const result = await service.joinTrip('trip-uuid', mockUser.id);
      
      expect(participantRepository.create).toHaveBeenCalledWith({
        trip: publicTrip,
        user: mockUser,
        role: 'participant',
        status: 'joined',
        joinedAt: expect.any(Date),
      });
    });

    it('should prevent joining non-existent trip', async () => {
      tripRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.joinTrip('non-existent-trip', mockUser.id)
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent non-existent user from joining', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.joinTrip('trip-uuid', 'non-existent-user')
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle invitation update correctly', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValue(mockUser);
      
      const invitedParticipant = {
        id: 'invited-participant',
        trip: mockTrip,
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
      expect(participantRepository.save).toHaveBeenCalledWith({
        ...invitedParticipant,
        status: 'joined',
        joinedAt: expect.any(Date),
      });
    });
  });

  describe('leaveTrip edge cases', () => {
    it('should prevent owner from leaving trip directly', async () => {
      const ownerTrip = { ...mockTrip, owner: mockOwner, generateShareToken: jest.fn() };
      
      tripRepository.findOne.mockResolvedValue(ownerTrip);
      
      await expect(
        service.leaveTrip('trip-uuid', mockOwner.id)
      ).rejects.toThrow(ForbiddenException);
      
      expect(tripRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'trip-uuid' },
        relations: ['owner'],
      });
    });

    it('should handle leaving non-existent trip', async () => {
      tripRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.leaveTrip('non-existent-trip', mockUser.id)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle user not being a participant', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      participantRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.leaveTrip('trip-uuid', 'non-participant-user')
      ).rejects.toThrow(NotFoundException);
    });

    it('should completely remove participant record on leave', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      
      const participantToRemove = {
        id: 'participant-to-remove',
        trip: mockTrip,
        user: mockUser,
        role: 'participant',
        status: 'joined',
      } as TripParticipant;
      
      participantRepository.findOne.mockResolvedValue(participantToRemove);
      participantRepository.remove.mockResolvedValue(undefined);
      
      await service.leaveTrip('trip-uuid', mockUser.id);
      
      expect(participantRepository.remove).toHaveBeenCalledWith(participantToRemove);
      expect(participantRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateParticipantRole edge cases', () => {
    it('should prevent non-owner from updating roles', async () => {
      const tripWithNonOwner = { 
        ...mockTrip, 
        owner: { ...mockOwner, id: 'different-owner' },
        participants: [],
        generateShareToken: jest.fn(),
      };
      
      tripRepository.findOne.mockResolvedValue(tripWithNonOwner);
      
      await expect(
        service.updateParticipantRole('trip-uuid', mockUser.id, { role: 'admin' }, 'non-owner-user')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent updating role of non-existent participant', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      participantRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.updateParticipantRole('trip-uuid', 'non-existent-participant', { role: 'admin' }, mockOwner.id)
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent changing owner role', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      
      const ownerParticipant = {
        id: 'owner-participant',
        role: 'owner',
        user: mockOwner,
        trip: mockTrip,
      } as TripParticipant;
      
      participantRepository.findOne.mockResolvedValue(ownerParticipant);
      
      await expect(
        service.updateParticipantRole('trip-uuid', mockOwner.id, { role: 'admin' }, mockOwner.id)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully update participant role from participant to admin', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      
      const participantToUpdate = {
        id: 'participant-to-update',
        role: 'participant',
        user: mockUser,
        trip: mockTrip,
        status: 'joined',
      } as TripParticipant;
      
      participantRepository.findOne.mockResolvedValue(participantToUpdate);
      
      const updatedParticipant = { ...participantToUpdate, role: 'admin' };
      participantRepository.save.mockResolvedValue(updatedParticipant);
      
      const result = await service.updateParticipantRole('trip-uuid', mockUser.id, { role: 'admin' }, mockOwner.id);
      
      expect(result.role).toBe('admin');
      expect(participantRepository.save).toHaveBeenCalledWith({
        ...participantToUpdate,
        role: 'admin',
      });
    });
  });

  describe('findOne permission integration', () => {
    it('should allow owner to access trip', async () => {
      tripRepository.findOne.mockResolvedValue({
        ...mockTrip,
        owner: mockOwner,
        participants: [],
        generateShareToken: jest.fn(),
      });
      
      const result = await service.findOne('trip-uuid', mockOwner.id);
      expect(result).toBeDefined();
    });

    it('should allow joined participant to access trip', async () => {
      const tripWithParticipant = {
        ...mockTrip,
        participants: [{
          user: { id: mockUser.id },
          status: 'joined',
        }],
      } as Trip;
      
      tripRepository.findOne.mockResolvedValue(tripWithParticipant);
      
      const result = await service.findOne('trip-uuid', mockUser.id);
      expect(result).toBeDefined();
    });

    it('should deny access to invited but not joined participant', async () => {
      const tripWithInvitedUser = {
        ...mockTrip,
        participants: [{
          user: { id: mockUser.id },
          status: 'invited',
        }],
      } as Trip;
      
      tripRepository.findOne.mockResolvedValue(tripWithInvitedUser);
      
      await expect(
        service.findOne('trip-uuid', mockUser.id)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny access to user who left the trip', async () => {
      const tripWithLeftUser = {
        ...mockTrip,
        participants: [{
          user: { id: mockUser.id },
          status: 'left',
        }],
      } as Trip;
      
      tripRepository.findOne.mockResolvedValue(tripWithLeftUser);
      
      await expect(
        service.findOne('trip-uuid', mockUser.id)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('concurrent operations safety', () => {
    it('should handle concurrent invitation attempts gracefully', async () => {
      const inviteDto = { userId: mockUser.id, role: 'participant' };
      
      tripRepository.findOne.mockResolvedValue(mockTrip);
      userRepository.findOne.mockResolvedValue(mockOwner);
      userRepository.findOne.mockResolvedValue(mockUser);
      
      // First call returns null (no existing participant)
      // Second call might return existing participant due to race condition
      participantRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'existing-participant',
          status: 'invited',
        } as TripParticipant);
      
      const newParticipant = {
        id: 'new-participant',
        trip: mockTrip,
        user: mockUser,
        role: 'participant',
        status: 'invited',
      } as TripParticipant;
      
      participantRepository.create.mockReturnValue(newParticipant);
      participantRepository.save.mockResolvedValue(newParticipant);
      
      // Should handle the race condition by checking again
      const result = await service.inviteParticipant('trip-uuid', inviteDto, mockOwner.id);
      expect(result).toBeDefined();
    });
  });

  describe('data consistency checks', () => {
    it('should maintain referential integrity when removing participants', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      
      const participantWithRelations = {
        id: 'participant-with-relations',
        trip: mockTrip,
        user: mockUser,
        role: 'participant',
        status: 'joined',
      } as TripParticipant;
      
      participantRepository.findOne.mockResolvedValue(participantWithRelations);
      participantRepository.remove.mockResolvedValue(undefined);
      
      await service.leaveTrip('trip-uuid', mockUser.id);
      
      // Verify that remove was called with the complete participant object
      expect(participantRepository.remove).toHaveBeenCalledWith(participantWithRelations);
    });

    it('should verify trip exists before participant operations', async () => {
      tripRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.inviteParticipant('non-existent-trip', { userId: mockUser.id, role: 'participant' }, mockOwner.id)
      ).rejects.toThrow();
    });
  });
});