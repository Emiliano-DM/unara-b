import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemsService } from '../../src/items/items.service';
import { Item } from '../../src/items/entities/item.entity';
import { ItemCategory } from '../../src/item-categories/entities/item-category.entity';
import { Trip } from '../../src/trips/entities/trip.entity';
import { User } from '../../src/users/entities/user.entity';
import { TripsService } from '../../src/trips/trips.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('Items-Trip Integration', () => {
  let itemsService: ItemsService;
  let tripsService: TripsService;
  let itemRepository: jest.Mocked<Repository<Item>>;
  let itemCategoryRepository: jest.Mocked<Repository<ItemCategory>>;
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

  const mockCategory: ItemCategory = {
    id: 'category-uuid',
    name: 'Electronics',
    description: 'Electronic items',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ItemCategory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: getRepositoryToken(Item),
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
          provide: getRepositoryToken(ItemCategory),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
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

    itemsService = module.get<ItemsService>(ItemsService);
    tripsService = module.get<TripsService>(TripsService);
    itemRepository = module.get(getRepositoryToken(Item));
    itemCategoryRepository = module.get(getRepositoryToken(ItemCategory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createForTrip', () => {
    it('should create item associated with trip', async () => {
      const createItemDto = {
        name: 'Travel Camera',
        description: 'High-quality travel camera',
        categoryId: mockCategory.id,
      };

      // Mock category lookup
      itemCategoryRepository.findOneBy.mockResolvedValue(mockCategory);

      // Mock user lookup
      jest
        .spyOn(itemsService['userRepository'], 'findOneBy')
        .mockResolvedValue(mockUser);

      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      // Mock item creation
      const expectedItem = {
        id: 'item-uuid',
        name: 'Travel Camera',
        description: 'High-quality travel camera',
        category: mockCategory,
        trip: mockTrip,
        createdBy: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Item;

      itemRepository.create.mockReturnValue(expectedItem);
      itemRepository.save.mockResolvedValue(expectedItem);

      const result = await itemsService.createForTrip(
        mockTrip.id,
        createItemDto,
        mockUser.id,
      );

      expect(tripsService.findOne).toHaveBeenCalledWith(
        mockTrip.id,
        mockUser.id,
      );
      expect(itemRepository.create).toHaveBeenCalledWith({
        name: 'Travel Camera',
        description: 'High-quality travel camera',
        category: mockCategory,
        trip: mockTrip,
        createdBy: mockUser,
      });
      expect(itemRepository.save).toHaveBeenCalledWith(expectedItem);
      expect(result).toEqual(expectedItem);
    });

    it('should throw NotFoundException when trip is not found', async () => {
      const createItemDto = {
        name: 'Travel Camera',
        categoryId: mockCategory.id,
      };

      // Mock trip not found
      jest
        .spyOn(tripsService, 'findOne')
        .mockRejectedValue(new NotFoundException('Trip not found'));

      await expect(
        itemsService.createForTrip(
          'non-existent-trip',
          createItemDto,
          mockUser.id,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(tripsService.findOne).toHaveBeenCalledWith(
        'non-existent-trip',
        mockUser.id,
      );
      expect(itemRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user cannot access trip', async () => {
      const createItemDto = {
        name: 'Travel Camera',
        categoryId: mockCategory.id,
      };

      // Mock forbidden access
      jest
        .spyOn(tripsService, 'findOne')
        .mockRejectedValue(new ForbiddenException('Access denied'));

      await expect(
        itemsService.createForTrip(
          mockTrip.id,
          createItemDto,
          'unauthorized-user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(tripsService.findOne).toHaveBeenCalledWith(
        mockTrip.id,
        'unauthorized-user',
      );
      expect(itemRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByTrip', () => {
    it('should list items by trip for authorized user', async () => {
      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      const mockItemList = [
        {
          id: 'item-1',
          name: 'Camera',
          category: mockCategory,
          trip: mockTrip,
          createdBy: mockUser,
        },
        {
          id: 'item-2',
          name: 'Laptop',
          category: mockCategory,
          trip: mockTrip,
          createdBy: mockUser,
        },
      ] as Item[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItemList),
      };

      itemRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await itemsService.findByTrip(mockTrip.id, mockUser.id);

      expect(tripsService.findOne).toHaveBeenCalledWith(
        mockTrip.id,
        mockUser.id,
      );
      expect(itemRepository.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'item.category',
        'category',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'item.trip',
        'trip',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'item.createdBy',
        'createdBy',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'trip.id = :tripId',
        { tripId: mockTrip.id },
      );
      expect(result).toEqual(mockItemList);
    });

    it('should handle user permissions for trip items', async () => {
      // Mock unauthorized access to trip
      jest
        .spyOn(tripsService, 'findOne')
        .mockRejectedValue(new ForbiddenException('Access denied'));

      await expect(
        itemsService.findByTrip(mockTrip.id, 'unauthorized-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(tripsService.findOne).toHaveBeenCalledWith(
        mockTrip.id,
        'unauthorized-user',
      );
      expect(itemRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should support pagination in trip item listing', async () => {
      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      itemRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const filterDto = { limit: 5, offset: 10 };
      await itemsService.findByTrip(mockTrip.id, mockUser.id, filterDto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('updateForTrip', () => {
    it('should update item within trip context with permission validation', async () => {
      const updateItemDto = {
        name: 'Updated Camera',
        description: 'Updated description',
      };

      const existingItem = {
        id: 'item-uuid',
        name: 'Old Camera',
        category: mockCategory,
        trip: mockTrip,
        createdBy: mockUser,
      } as Item;

      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      // Mock item lookup with relations
      itemRepository.findOne.mockResolvedValue(existingItem);

      const updatedItem = { ...existingItem, ...updateItemDto };
      itemRepository.preload.mockResolvedValue(updatedItem);
      itemRepository.save.mockResolvedValue(updatedItem);

      const result = await itemsService.updateForTrip(
        'item-uuid',
        updateItemDto,
        mockTrip.id,
        mockUser.id,
      );

      expect(tripsService.findOne).toHaveBeenCalledWith(
        mockTrip.id,
        mockUser.id,
      );
      expect(itemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-uuid' },
        relations: { trip: true, createdBy: true },
      });
      expect(result).toEqual(updatedItem);
    });

    it('should prevent updating item from different trip', async () => {
      const updateItemDto = {
        name: 'Updated Camera',
      };

      const otherTrip = { ...mockTrip, id: 'other-trip-id' };
      const itemFromOtherTrip = {
        id: 'item-uuid',
        name: 'Old Camera',
        category: mockCategory,
        trip: otherTrip,
        createdBy: mockUser,
      } as Item;

      // Mock trip access validation - user can access current trip
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      // Mock item from different trip
      itemRepository.findOne.mockResolvedValue(itemFromOtherTrip);

      await expect(
        itemsService.updateForTrip(
          'item-uuid',
          updateItemDto,
          mockTrip.id,
          mockUser.id,
        ),
      ).rejects.toThrow('Item does not belong to this trip');

      expect(itemRepository.preload).not.toHaveBeenCalled();
    });
  });

  describe('removeFromTrip', () => {
    it('should remove item from trip with proper authorization', async () => {
      const itemToRemove = {
        id: 'item-uuid',
        name: 'Camera to Remove',
        category: mockCategory,
        trip: mockTrip,
        createdBy: mockUser,
      } as Item;

      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      // Mock item lookup
      itemRepository.findOne.mockResolvedValue(itemToRemove);
      itemRepository.remove.mockResolvedValue(itemToRemove);

      await itemsService.removeFromTrip('item-uuid', mockTrip.id, mockUser.id);

      expect(tripsService.findOne).toHaveBeenCalledWith(
        mockTrip.id,
        mockUser.id,
      );
      expect(itemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-uuid' },
        relations: { trip: true, createdBy: true },
      });
      expect(itemRepository.remove).toHaveBeenCalledWith(itemToRemove);
    });

    it('should prevent removing item from different trip', async () => {
      const otherTrip = { ...mockTrip, id: 'other-trip-id' };
      const itemFromOtherTrip = {
        id: 'item-uuid',
        name: 'Camera',
        trip: otherTrip,
        createdBy: mockUser,
      } as Item;

      // Mock trip access validation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      // Mock item from different trip
      itemRepository.findOne.mockResolvedValue(itemFromOtherTrip);

      await expect(
        itemsService.removeFromTrip('item-uuid', mockTrip.id, mockUser.id),
      ).rejects.toThrow('Item does not belong to this trip');

      expect(itemRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('creator tracking', () => {
    it('should track item creator correctly', async () => {
      const createItemDto = {
        name: 'Travel Accessory',
        categoryId: mockCategory.id,
      };

      const creatorUser = { ...mockUser, id: 'creator-id' };

      // Mock dependencies
      itemCategoryRepository.findOneBy.mockResolvedValue(mockCategory);
      jest
        .spyOn(itemsService['userRepository'], 'findOneBy')
        .mockResolvedValue(creatorUser);
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      const expectedItem = {
        id: 'item-uuid',
        name: 'Travel Accessory',
        category: mockCategory,
        trip: mockTrip,
        createdBy: creatorUser,
      } as Item;

      itemRepository.create.mockReturnValue(expectedItem);
      itemRepository.save.mockResolvedValue(expectedItem);

      const result = await itemsService.createForTrip(
        mockTrip.id,
        createItemDto,
        'creator-id',
      );

      expect(result.createdBy.id).toBe('creator-id');
      expect(itemRepository.create).toHaveBeenCalledWith({
        name: 'Travel Accessory',
        category: mockCategory,
        trip: mockTrip,
        createdBy: creatorUser,
      });
    });
  });
});
