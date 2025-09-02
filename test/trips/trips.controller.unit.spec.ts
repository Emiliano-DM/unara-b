import { Test, TestingModule } from '@nestjs/testing';
import { TripsController } from '../../src/trips/trips.controller';
import { TripsService } from '../../src/trips/trips.service';
import { CreateTripDto } from '../../src/trips/dto/create-trip.dto';
import { UpdateTripDto } from '../../src/trips/dto/update-trip.dto';
import { FilterTripDto } from '../../src/trips/dto/filter-trip.dto';
import { User } from '../../src/users/entities/user.entity';
import { ItemsService } from '../../src/items/items.service';
import { LuggageService } from '../../src/luggage/services/luggage.service';

describe('TripsController Unit Tests', () => {
  let controller: TripsController;
  let service: jest.Mocked<TripsService>;

  const mockUser: User = {
    id: 'user-uuid-from-auth',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
  } as User;

  const mockTrip = {
    id: 'trip-1',
    name: 'Test Trip',
    status: 'planning',
    shareToken: 'test-token',
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByShareToken: jest.fn(),
      inviteParticipant: jest.fn(),
      joinTrip: jest.fn(),
      leaveTrip: jest.fn(),
      updateParticipantRole: jest.fn(),
    };

    const mockItemsService = {
      createForTrip: jest.fn(),
      findByTrip: jest.fn(),
    };

    const mockLuggageService = {
      createForTrip: jest.fn(),
      findByTrip: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: mockService,
        },
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
        {
          provide: LuggageService,
          useValue: mockLuggageService,
        },
      ],
    }).compile();

    controller = module.get<TripsController>(TripsController);
    service = module.get(TripsService);
  });

  describe('create', () => {
    it('should create a trip', async () => {
      const createTripDto: CreateTripDto = {
        name: 'Test Trip',
        description: 'Test Description',
      };

      service.create.mockResolvedValue(mockTrip as any);

      const result = await controller.create(createTripDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createTripDto, mockUser.id);
      expect(result).toEqual(mockTrip);
    });
  });

  describe('findAll', () => {
    it('should return array of trips', async () => {
      const filterDto: FilterTripDto = { search: 'test' };
      const expectedTrips = [mockTrip];

      service.findAll.mockResolvedValue(expectedTrips as any);

      const result = await controller.findAll(filterDto, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, filterDto);
      expect(result).toEqual(expectedTrips);
    });
  });

  describe('findOne', () => {
    it('should return a single trip', async () => {
      service.findOne.mockResolvedValue(mockTrip as any);

      const result = await controller.findOne('trip-1', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('trip-1', mockUser.id);
      expect(result).toEqual(mockTrip);
    });
  });

  describe('findByShareToken', () => {
    it('should return trip by share token', async () => {
      service.findByShareToken.mockResolvedValue(mockTrip as any);

      const result = await controller.findByShareToken('test-token');

      expect(service.findByShareToken).toHaveBeenCalledWith('test-token');
      expect(result).toEqual(mockTrip);
    });
  });

  describe('update', () => {
    it('should update a trip', async () => {
      const updateDto: UpdateTripDto = { name: 'Updated Trip' };
      const updatedTrip = { ...mockTrip, name: 'Updated Trip' };

      service.update.mockResolvedValue(updatedTrip as any);

      const result = await controller.update('trip-1', updateDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(
        'trip-1',
        updateDto,
        mockUser.id,
      );
      expect(result).toEqual(updatedTrip);
    });
  });

  describe('remove', () => {
    it('should remove a trip', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove('trip-1', mockUser);

      expect(service.remove).toHaveBeenCalledWith('trip-1', mockUser.id);
      expect(result).toBeUndefined();
    });
  });

  describe('participant management', () => {
    it('should invite participant', async () => {
      const inviteDto = { userId: 'user-2' };
      const mockParticipant = { id: 'participant-1', role: 'participant' };

      service.inviteParticipant.mockResolvedValue(mockParticipant as any);

      const result = await controller.inviteParticipant(
        'trip-1',
        inviteDto,
        mockUser,
      );

      expect(service.inviteParticipant).toHaveBeenCalledWith(
        'trip-1',
        inviteDto,
        mockUser.id,
      );
      expect(result).toEqual(mockParticipant);
    });

    it('should allow joining trip', async () => {
      const mockParticipant = { id: 'participant-1', status: 'joined' };

      service.joinTrip.mockResolvedValue(mockParticipant as any);

      const result = await controller.joinTrip('trip-1', mockUser);

      expect(service.joinTrip).toHaveBeenCalledWith('trip-1', mockUser.id);
      expect(result).toEqual(mockParticipant);
    });

    it('should allow leaving trip', async () => {
      service.leaveTrip.mockResolvedValue(undefined);

      const result = await controller.leaveTrip('trip-1', mockUser);

      expect(service.leaveTrip).toHaveBeenCalledWith('trip-1', mockUser.id);
      expect(result).toBeUndefined();
    });

    it('should update participant role', async () => {
      const updateRoleDto = { role: 'admin' };
      const mockParticipant = { id: 'participant-1', role: 'admin' };

      service.updateParticipantRole.mockResolvedValue(mockParticipant as any);

      const result = await controller.updateParticipantRole(
        'trip-1',
        'participant-1',
        updateRoleDto,
        mockUser,
      );

      expect(service.updateParticipantRole).toHaveBeenCalledWith(
        'trip-1',
        'participant-1',
        updateRoleDto,
        mockUser.id,
      );
      expect(result).toEqual(mockParticipant);
    });
  });
});
