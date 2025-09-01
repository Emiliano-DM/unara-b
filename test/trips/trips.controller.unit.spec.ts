import { Test, TestingModule } from '@nestjs/testing';
import { TripsController } from '../../src/trips/trips.controller';
import { TripsService } from '../../src/trips/trips.service';
import { CreateTripDto } from '../../src/trips/dto/create-trip.dto';
import { UpdateTripDto } from '../../src/trips/dto/update-trip.dto';
import { FilterTripDto } from '../../src/trips/dto/filter-trip.dto';

describe('TripsController Unit Tests', () => {
  let controller: TripsController;
  let service: jest.Mocked<TripsService>;

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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: mockService,
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

      const result = await controller.create(createTripDto);

      expect(service.create).toHaveBeenCalledWith(createTripDto, 'user-uuid-from-auth');
      expect(result).toEqual(mockTrip);
    });
  });

  describe('findAll', () => {
    it('should return array of trips', async () => {
      const filterDto: FilterTripDto = { search: 'test' };
      const expectedTrips = [mockTrip];

      service.findAll.mockResolvedValue(expectedTrips as any);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith('user-uuid-from-auth', filterDto);
      expect(result).toEqual(expectedTrips);
    });
  });

  describe('findOne', () => {
    it('should return a single trip', async () => {
      service.findOne.mockResolvedValue(mockTrip as any);

      const result = await controller.findOne('trip-1');

      expect(service.findOne).toHaveBeenCalledWith('trip-1', 'user-uuid-from-auth');
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

      const result = await controller.update('trip-1', updateDto);

      expect(service.update).toHaveBeenCalledWith('trip-1', updateDto, 'user-uuid-from-auth');
      expect(result).toEqual(updatedTrip);
    });
  });

  describe('remove', () => {
    it('should remove a trip', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove('trip-1');

      expect(service.remove).toHaveBeenCalledWith('trip-1', 'user-uuid-from-auth');
      expect(result).toBeUndefined();
    });
  });

  describe('participant management', () => {
    it('should invite participant', async () => {
      const inviteDto = { userId: 'user-2' };
      const mockParticipant = { id: 'participant-1', role: 'participant' };

      service.inviteParticipant.mockResolvedValue(mockParticipant as any);

      const result = await controller.inviteParticipant('trip-1', inviteDto);

      expect(service.inviteParticipant).toHaveBeenCalledWith('trip-1', inviteDto, 'user-uuid-from-auth');
      expect(result).toEqual(mockParticipant);
    });

    it('should allow joining trip', async () => {
      const mockParticipant = { id: 'participant-1', status: 'joined' };

      service.joinTrip.mockResolvedValue(mockParticipant as any);

      const result = await controller.joinTrip('trip-1');

      expect(service.joinTrip).toHaveBeenCalledWith('trip-1', 'user-uuid-from-auth');
      expect(result).toEqual(mockParticipant);
    });

    it('should allow leaving trip', async () => {
      service.leaveTrip.mockResolvedValue(undefined);

      const result = await controller.leaveTrip('trip-1');

      expect(service.leaveTrip).toHaveBeenCalledWith('trip-1', 'user-uuid-from-auth');
      expect(result).toBeUndefined();
    });

    it('should update participant role', async () => {
      const updateRoleDto = { role: 'admin' };
      const mockParticipant = { id: 'participant-1', role: 'admin' };

      service.updateParticipantRole.mockResolvedValue(mockParticipant as any);

      const result = await controller.updateParticipantRole('trip-1', 'participant-1', updateRoleDto);

      expect(service.updateParticipantRole).toHaveBeenCalledWith('trip-1', 'participant-1', updateRoleDto, 'user-uuid-from-auth');
      expect(result).toEqual(mockParticipant);
    });
  });
});