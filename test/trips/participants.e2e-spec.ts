import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';

describe('/trips/:id/participants (e2e)', () => {
  let app: INestApplication;
  let tripRepository: Repository<Trip>;
  let participantRepository: Repository<TripParticipant>;
  let userRepository: Repository<User>;

  const mockOwner: Partial<User> = {
    id: 'owner-uuid',
    fullname: 'Trip Owner',
    email: 'owner@example.com',
    username: 'tripowner',
  };

  const mockParticipant: Partial<User> = {
    id: 'participant-uuid',
    fullname: 'Trip Participant',
    email: 'participant@example.com',
    username: 'tripparticipant',
  };

  const mockAdmin: Partial<User> = {
    id: 'admin-uuid',
    fullname: 'Trip Admin',
    email: 'admin@example.com',
    username: 'tripadmin',
  };

  let testTrip: Trip;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Trip))
      .useValue({
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn(),
        }),
        remove: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(TripParticipant))
      .useValue({
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        findOne: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tripRepository = moduleFixture.get<Repository<Trip>>(
      getRepositoryToken(Trip),
    );
    participantRepository = moduleFixture.get<Repository<TripParticipant>>(
      getRepositoryToken(TripParticipant),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Create test trip
    testTrip = {
      id: 'trip-uuid',
      name: 'Test Trip',
      description: 'Test Description',
      destination: 'Test Destination',
      status: 'planning',
      owner: mockOwner as User,
      isPublic: true,
      shareToken: 'test-share-token',
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      generateShareToken: jest.fn(),
    } as Trip;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /trips/:id/invite', () => {
    it('should invite user to trip (owner)', async () => {
      const inviteDto = {
        userId: mockParticipant.id,
        role: 'participant',
      };

      // Mock finding the trip with owner
      (tripRepository.findOne as jest.Mock).mockResolvedValue(testTrip);

      // Mock finding the user to invite
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockParticipant);

      // Mock checking if participant already exists
      (participantRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Mock creating and saving participant
      const mockTripParticipant = {
        id: 'participant-relation-uuid',
        trip: testTrip,
        user: mockParticipant,
        role: 'participant',
        status: 'invited',
      };
      (participantRepository.create as jest.Mock).mockReturnValue(
        mockTripParticipant,
      );
      (participantRepository.save as jest.Mock).mockResolvedValue(
        mockTripParticipant,
      );

      const response = await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/invite`)
        .send(inviteDto)
        .expect(201);

      expect(response.body).toMatchObject({
        role: 'participant',
        status: 'invited',
      });

      expect(tripRepository.findOne).toHaveBeenCalledWith({
        where: { id: testTrip.id },
        relations: ['owner', 'participants', 'participants.user'],
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockParticipant.id },
      });
      expect(participantRepository.create).toHaveBeenCalled();
      expect(participantRepository.save).toHaveBeenCalled();
    });

    it('should allow admin to invite user', async () => {
      const inviteDto = {
        userId: mockParticipant.id,
        role: 'participant',
      };

      // Mock trip with admin as current user
      const tripWithAdmin = {
        ...testTrip,
        participants: [
          {
            user: { id: mockAdmin.id },
            role: 'admin',
            status: 'joined',
          },
        ],
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(tripWithAdmin);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockParticipant);
      (participantRepository.findOne as jest.Mock).mockResolvedValue(null);

      const mockTripParticipant = {
        id: 'participant-relation-uuid',
        trip: testTrip,
        user: mockParticipant,
        role: 'participant',
        status: 'invited',
      };
      (participantRepository.create as jest.Mock).mockReturnValue(
        mockTripParticipant,
      );
      (participantRepository.save as jest.Mock).mockResolvedValue(
        mockTripParticipant,
      );

      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/invite`)
        .send(inviteDto)
        .expect(201);
    });

    it('should fail when non-owner/non-admin tries to invite', async () => {
      const inviteDto = {
        userId: mockParticipant.id,
        role: 'participant',
      };

      // Mock trip where current user is just a participant
      const tripWithParticipant = {
        ...testTrip,
        owner: { id: 'other-owner' },
        participants: [
          {
            user: { id: 'regular-participant' },
            role: 'participant',
            status: 'joined',
          },
        ],
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(
        tripWithParticipant,
      );

      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/invite`)
        .send(inviteDto)
        .expect(403);
    });

    it('should fail when trying to invite user that is already a participant', async () => {
      const inviteDto = {
        userId: mockParticipant.id,
        role: 'participant',
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(testTrip);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockParticipant);

      // Mock that participant already exists
      (participantRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'existing-participant',
        status: 'joined',
      });

      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/invite`)
        .send(inviteDto)
        .expect(400);
    });

    it('should fail with invalid role', async () => {
      const inviteDto = {
        userId: mockParticipant.id,
        role: 'owner', // Not allowed
      };

      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/invite`)
        .send(inviteDto)
        .expect(400);
    });

    it('should fail with invalid userId format', async () => {
      const inviteDto = {
        userId: 'invalid-uuid',
        role: 'participant',
      };

      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/invite`)
        .send(inviteDto)
        .expect(400);
    });
  });

  describe('POST /trips/:id/join', () => {
    it('should allow user to join public trip', async () => {
      const publicTrip = {
        ...testTrip,
        isPublic: true,
        participants: [],
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(publicTrip);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockParticipant);
      (participantRepository.findOne as jest.Mock).mockResolvedValue(null);

      const mockTripParticipant = {
        id: 'new-participant-uuid',
        trip: publicTrip,
        user: mockParticipant,
        role: 'participant',
        status: 'joined',
      };
      (participantRepository.create as jest.Mock).mockReturnValue(
        mockTripParticipant,
      );
      (participantRepository.save as jest.Mock).mockResolvedValue(
        mockTripParticipant,
      );

      const response = await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/join`)
        .expect(201);

      expect(response.body).toMatchObject({
        role: 'participant',
        status: 'joined',
      });
    });

    it('should allow invited user to join trip', async () => {
      const tripWithInvitation = {
        ...testTrip,
        isPublic: false,
        participants: [
          {
            user: { id: mockParticipant.id },
            status: 'invited',
            role: 'participant',
          },
        ],
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(
        tripWithInvitation,
      );
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockParticipant);

      // Mock finding existing invitation
      const existingInvitation = {
        id: 'invitation-uuid',
        trip: tripWithInvitation,
        user: mockParticipant,
        role: 'participant',
        status: 'invited',
      };
      (participantRepository.findOne as jest.Mock).mockResolvedValue(
        existingInvitation,
      );

      // Mock updating invitation to joined
      const joinedParticipant = { ...existingInvitation, status: 'joined' };
      (participantRepository.save as jest.Mock).mockResolvedValue(
        joinedParticipant,
      );

      const response = await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/join`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'joined',
      });
    });

    it('should fail when trying to join private trip without invitation', async () => {
      const privateTrip = {
        ...testTrip,
        isPublic: false,
        participants: [],
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(privateTrip);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockParticipant);
      (participantRepository.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/join`)
        .expect(403);
    });

    it('should fail when user is already a joined participant', async () => {
      const tripWithJoinedUser = {
        ...testTrip,
        participants: [
          {
            user: { id: mockParticipant.id },
            status: 'joined',
          },
        ],
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(
        tripWithJoinedUser,
      );
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockParticipant);
      (participantRepository.findOne as jest.Mock).mockResolvedValue({
        status: 'joined',
      });

      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/join`)
        .expect(400);
    });
  });

  describe('DELETE /trips/:id/leave', () => {
    it('should allow participant to leave trip', async () => {
      const tripWithParticipant = {
        ...testTrip,
        participants: [
          {
            user: { id: mockParticipant.id },
            status: 'joined',
            role: 'participant',
          },
        ],
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(
        tripWithParticipant,
      );

      const participantToRemove = {
        id: 'participant-to-remove',
        trip: tripWithParticipant,
        user: mockParticipant,
        status: 'joined',
      };
      (participantRepository.findOne as jest.Mock).mockResolvedValue(
        participantToRemove,
      );
      (participantRepository.remove as jest.Mock).mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/trips/${testTrip.id}/leave`)
        .expect(200);

      expect(participantRepository.findOne).toHaveBeenCalledWith({
        where: { trip: { id: testTrip.id }, user: { id: mockParticipant.id } },
        relations: ['trip', 'user'],
      });
      expect(participantRepository.remove).toHaveBeenCalledWith(
        participantToRemove,
      );
    });

    it('should fail when owner tries to leave (must transfer ownership first)', async () => {
      const ownerTrip = {
        ...testTrip,
        owner: { id: mockOwner.id },
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(ownerTrip);

      await request(app.getHttpServer())
        .delete(`/trips/${testTrip.id}/leave`)
        .expect(403);
    });

    it('should fail when user is not a participant', async () => {
      (tripRepository.findOne as jest.Mock).mockResolvedValue(testTrip);
      (participantRepository.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete(`/trips/${testTrip.id}/leave`)
        .expect(404);
    });
  });

  describe('PATCH /trips/:id/participants/:userId/role', () => {
    it('should allow owner to update participant role', async () => {
      const updateRoleDto = { role: 'admin' };

      const tripWithParticipants = {
        ...testTrip,
        owner: { id: mockOwner.id },
        participants: [
          {
            user: { id: mockParticipant.id },
            role: 'participant',
            status: 'joined',
          },
        ],
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(
        tripWithParticipants,
      );

      const participantToUpdate = {
        id: 'participant-to-update',
        trip: tripWithParticipants,
        user: mockParticipant,
        role: 'participant',
        status: 'joined',
      };
      (participantRepository.findOne as jest.Mock).mockResolvedValue(
        participantToUpdate,
      );

      const updatedParticipant = { ...participantToUpdate, role: 'admin' };
      (participantRepository.save as jest.Mock).mockResolvedValue(
        updatedParticipant,
      );

      const response = await request(app.getHttpServer())
        .patch(`/trips/${testTrip.id}/participants/${mockParticipant.id}/role`)
        .send(updateRoleDto)
        .expect(200);

      expect(response.body).toMatchObject({
        role: 'admin',
      });

      expect(participantRepository.save).toHaveBeenCalledWith({
        ...participantToUpdate,
        role: 'admin',
      });
    });

    it('should fail when non-owner tries to update roles', async () => {
      const updateRoleDto = { role: 'admin' };

      const tripWithNonOwner = {
        ...testTrip,
        owner: { id: 'other-owner' },
      };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(tripWithNonOwner);

      await request(app.getHttpServer())
        .patch(`/trips/${testTrip.id}/participants/${mockParticipant.id}/role`)
        .send(updateRoleDto)
        .expect(403);
    });

    it('should fail when trying to change role to owner', async () => {
      const updateRoleDto = { role: 'owner' };

      await request(app.getHttpServer())
        .patch(`/trips/${testTrip.id}/participants/${mockParticipant.id}/role`)
        .send(updateRoleDto)
        .expect(400);
    });

    it('should fail when participant does not exist', async () => {
      const updateRoleDto = { role: 'admin' };

      (tripRepository.findOne as jest.Mock).mockResolvedValue(testTrip);
      (participantRepository.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/trips/${testTrip.id}/participants/non-existent-user/role`)
        .send(updateRoleDto)
        .expect(404);
    });
  });
});
