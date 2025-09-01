import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LuggageService } from '../../src/luggage/services/luggage.service';
import { Luggage } from '../../src/luggage/entities/luggage.entity';
import { LuggageCategory } from '../../src/luggage-categories/entities/luggage-category.entity';
import { Trip } from '../../src/trips/entities/trip.entity';
import { User } from '../../src/users/entities/user.entity';
import { TripsService } from '../../src/trips/trips.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('Luggage-Trip Integration', () => {
  let luggageService: LuggageService;
  let tripsService: TripsService;
  let luggageRepository: jest.Mocked<Repository<Luggage>>;
  let luggageCategoryRepository: jest.Mocked<Repository<LuggageCategory>>;
  let tripRepository: jest.Mocked<Repository<Trip>>;

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

  const mockCategory: LuggageCategory = {
    id: 'category-uuid',
    name: 'Clothing',
    description: 'Clothing items',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as LuggageCategory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LuggageService,
        {
          provide: getRepositoryToken(Luggage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            }),
            preload: jest.fn(),
            findOneBy: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LuggageCategory),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Trip),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TripsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    luggageService = module.get<LuggageService>(LuggageService);
    tripsService = module.get<TripsService>(TripsService);
    luggageRepository = module.get(getRepositoryToken(Luggage));
    luggageCategoryRepository = module.get(getRepositoryToken(LuggageCategory));
    tripRepository = module.get(getRepositoryToken(Trip));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createForTrip', () => {
    it('should create luggage associated with trip', async () => {
      const createLuggageDto = {
        name: 'Travel Backpack',
        categoryId: mockCategory.id,
      };

      // Mock category lookup
      luggageCategoryRepository.findOneBy.mockResolvedValue(mockCategory);
      
      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      // Mock luggage creation
      const expectedLuggage = {
        id: 'luggage-uuid',
        name: 'Travel Backpack',
        category: mockCategory,
        trip: mockTrip,
        user: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Luggage;

      luggageRepository.create.mockReturnValue(expectedLuggage);
      luggageRepository.save.mockResolvedValue(expectedLuggage);

      const result = await luggageService.createForTrip(mockTrip.id, createLuggageDto, mockUser.id);

      expect(tripsService.findOne).toHaveBeenCalledWith(mockTrip.id, mockUser.id);
      expect(luggageRepository.create).toHaveBeenCalledWith({
        name: 'Travel Backpack',
        category: mockCategory,
        trip: mockTrip,
        user: mockUser,
      });
      expect(luggageRepository.save).toHaveBeenCalledWith(expectedLuggage);
      expect(result).toEqual(expectedLuggage);
    });

    it('should throw NotFoundException when trip is not found', async () => {
      const createLuggageDto = {
        name: 'Travel Backpack',
        categoryId: mockCategory.id,
      };

      // Mock trip not found
      jest.spyOn(tripsService, 'findOne').mockRejectedValue(new NotFoundException('Trip not found'));

      await expect(
        luggageService.createForTrip('non-existent-trip', createLuggageDto, mockUser.id)
      ).rejects.toThrow(NotFoundException);

      expect(tripsService.findOne).toHaveBeenCalledWith('non-existent-trip', mockUser.id);
      expect(luggageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user cannot access trip', async () => {
      const createLuggageDto = {
        name: 'Travel Backpack',
        categoryId: mockCategory.id,
      };

      // Mock forbidden access
      jest.spyOn(tripsService, 'findOne').mockRejectedValue(new ForbiddenException('Access denied'));

      await expect(
        luggageService.createForTrip(mockTrip.id, createLuggageDto, 'unauthorized-user')
      ).rejects.toThrow(ForbiddenException);

      expect(tripsService.findOne).toHaveBeenCalledWith(mockTrip.id, 'unauthorized-user');
      expect(luggageRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category is not found', async () => {
      const createLuggageDto = {
        name: 'Travel Backpack',
        categoryId: 'non-existent-category',
      };

      // Mock trip access success
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);
      
      // Mock category not found
      luggageCategoryRepository.findOneBy.mockResolvedValue(null);

      await expect(
        luggageService.createForTrip(mockTrip.id, createLuggageDto, mockUser.id)
      ).rejects.toThrow(NotFoundException);

      expect(luggageCategoryRepository.findOneBy).toHaveBeenCalledWith({ id: 'non-existent-category' });
    });
  });

  describe('findByTrip', () => {
    it('should list luggage by trip for authorized user', async () => {
      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      const mockLuggageList = [
        {
          id: 'luggage-1',
          name: 'Backpack',
          category: mockCategory,
          trip: mockTrip,
          user: mockUser,
        },
        {
          id: 'luggage-2',
          name: 'Suitcase',
          category: mockCategory,
          trip: mockTrip,
          user: mockUser,
        },
      ] as Luggage[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLuggageList),
      };

      luggageRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await luggageService.findByTrip(mockTrip.id, mockUser.id);

      expect(tripsService.findOne).toHaveBeenCalledWith(mockTrip.id, mockUser.id);
      expect(luggageRepository.createQueryBuilder).toHaveBeenCalledWith('luggage');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('luggage.category', 'category');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('luggage.trip', 'trip');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('luggage.user', 'user');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('trip.id = :tripId', { tripId: mockTrip.id });
      expect(result).toEqual(mockLuggageList);
    });

    it('should handle user permissions for trip luggage', async () => {
      // Mock unauthorized access to trip
      jest.spyOn(tripsService, 'findOne').mockRejectedValue(new ForbiddenException('Access denied'));

      await expect(
        luggageService.findByTrip(mockTrip.id, 'unauthorized-user')
      ).rejects.toThrow(ForbiddenException);

      expect(tripsService.findOne).toHaveBeenCalledWith(mockTrip.id, 'unauthorized-user');
      expect(luggageRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return empty array for trip with no luggage', async () => {
      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      luggageRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await luggageService.findByTrip(mockTrip.id, mockUser.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should support pagination in trip luggage listing', async () => {
      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      luggageRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const filterDto = { limit: 5, offset: 10 };
      await luggageService.findByTrip(mockTrip.id, mockUser.id, filterDto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('updateForTrip', () => {
    it('should update luggage within trip context with permission validation', async () => {
      const updateLuggageDto = {
        name: 'Updated Backpack',
      };

      const existingLuggage = {
        id: 'luggage-uuid',
        name: 'Old Backpack',
        category: mockCategory,
        trip: mockTrip,
        user: mockUser,
      } as Luggage;

      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);
      
      // Mock luggage lookup with relations
      luggageRepository.findOne.mockResolvedValue(existingLuggage);
      
      const updatedLuggage = { ...existingLuggage, ...updateLuggageDto };
      luggageRepository.preload.mockResolvedValue(updatedLuggage);
      luggageRepository.save.mockResolvedValue(updatedLuggage);

      const result = await luggageService.updateForTrip('luggage-uuid', updateLuggageDto, mockTrip.id, mockUser.id);

      expect(tripsService.findOne).toHaveBeenCalledWith(mockTrip.id, mockUser.id);
      expect(luggageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'luggage-uuid' },
        relations: { trip: true, user: true },
      });
      expect(result).toEqual(updatedLuggage);
    });

    it('should prevent updating luggage from different trip', async () => {
      const updateLuggageDto = {
        name: 'Updated Backpack',
      };

      const otherTrip = { ...mockTrip, id: 'other-trip-id' };
      const luggageFromOtherTrip = {
        id: 'luggage-uuid',
        name: 'Old Backpack',
        category: mockCategory,
        trip: otherTrip,
        user: mockUser,
      } as Luggage;

      // Mock trip access validation - user can access current trip
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);
      
      // Mock luggage from different trip
      luggageRepository.findOne.mockResolvedValue(luggageFromOtherTrip);

      await expect(
        luggageService.updateForTrip('luggage-uuid', updateLuggageDto, mockTrip.id, mockUser.id)
      ).rejects.toThrow('Luggage does not belong to this trip');

      expect(luggageRepository.preload).not.toHaveBeenCalled();
    });
  });

  describe('removeFromTrip', () => {
    it('should remove luggage from trip with proper authorization', async () => {
      const luggageToRemove = {
        id: 'luggage-uuid',
        name: 'Backpack to Remove',
        category: mockCategory,
        trip: mockTrip,
        user: mockUser,
      } as Luggage;

      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);
      
      // Mock luggage lookup
      luggageRepository.findOne.mockResolvedValue(luggageToRemove);
      luggageRepository.remove.mockResolvedValue(luggageToRemove);

      await luggageService.removeFromTrip('luggage-uuid', mockTrip.id, mockUser.id);

      expect(tripsService.findOne).toHaveBeenCalledWith(mockTrip.id, mockUser.id);
      expect(luggageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'luggage-uuid' },
        relations: { trip: true, user: true },
      });
      expect(luggageRepository.remove).toHaveBeenCalledWith(luggageToRemove);
    });

    it('should prevent removing luggage from different trip', async () => {
      const otherTrip = { ...mockTrip, id: 'other-trip-id' };
      const luggageFromOtherTrip = {
        id: 'luggage-uuid',
        name: 'Backpack',
        trip: otherTrip,
        user: mockUser,
      } as Luggage;

      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);
      
      // Mock luggage from different trip
      luggageRepository.findOne.mockResolvedValue(luggageFromOtherTrip);

      await expect(
        luggageService.removeFromTrip('luggage-uuid', mockTrip.id, mockUser.id)
      ).rejects.toThrow('Luggage does not belong to this trip');

      expect(luggageRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('permission integration', () => {
    it('should allow trip participants to create luggage', async () => {
      const participantTrip = {
        ...mockTrip,
        participants: [{
          user: { id: 'participant-id' },
          status: 'joined',
          role: 'participant',
        }],
      } as Trip;

      const createLuggageDto = {
        name: 'Participant Luggage',
        categoryId: mockCategory.id,
      };

      // Mock trip access for participant
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(participantTrip);
      luggageCategoryRepository.findOneBy.mockResolvedValue(mockCategory);

      const expectedLuggage = {
        id: 'luggage-uuid',
        name: 'Participant Luggage',
        category: mockCategory,
        trip: participantTrip,
        user: { id: 'participant-id' } as User,
      } as Luggage;

      luggageRepository.create.mockReturnValue(expectedLuggage);
      luggageRepository.save.mockResolvedValue(expectedLuggage);

      const result = await luggageService.createForTrip(participantTrip.id, createLuggageDto, 'participant-id');

      expect(result.trip.id).toBe(participantTrip.id);
      expect(tripsService.findOne).toHaveBeenCalledWith(participantTrip.id, 'participant-id');
    });
  });
});