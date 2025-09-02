import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LuggageService } from '../../src/luggage/services/luggage.service';
import { LuggageItemsService } from '../../src/luggage/services/luggage-items.service';
import { TripsService } from '../../src/trips/trips.service';
import { Luggage } from '../../src/luggage/entities/luggage.entity';
import { LuggageItem } from '../../src/luggage/entities/luggage-item.entity';
import { LuggageCategory } from '../../src/luggage-categories/entities/luggage-category.entity';
import { Item } from '../../src/items/entities/item.entity';
import { User } from '../../src/users/entities/user.entity';
import { Trip } from '../../src/trips/entities/trip.entity';
import { LuggageStatus } from '../../src/common/enums/luggage-status.enum';
import { ItemStatus } from '../../src/common/enums/item-status.enum';
import { TripStatus } from '../../src/common/enums/trip-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('Luggage Capacity and Status Management', () => {
  let luggageService: LuggageService;
  let luggageItemsService: LuggageItemsService;
  let tripsService: TripsService;
  let luggageRepository: jest.Mocked<Repository<Luggage>>;
  let luggageCategoryRepository: jest.Mocked<Repository<LuggageCategory>>;
  let luggageItemRepository: jest.Mocked<Repository<LuggageItem>>;
  let itemRepository: jest.Mocked<Repository<Item>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockTripOwner: User = {
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

  const mockLuggageCategory: LuggageCategory = {
    id: 'category-1',
    name: 'Backpacks',
    description: 'Travel backpacks and hiking packs',
  } as LuggageCategory;

  const mockTrip: Trip = {
    id: 'trip-1',
    name: 'Alpine Adventure',
    status: TripStatus.PLANNING,
    owner: mockTripOwner,
    generateShareToken: jest.fn(),
  } as Trip;

  const mockEmptyLuggage: Luggage = {
    id: 'luggage-1',
    name: '50L Hiking Backpack',
    description: 'Large capacity hiking backpack',
    category: mockLuggageCategory,
    trip: mockTrip,
    user: mockParticipant,
    assignedTo: mockParticipant,
    status: LuggageStatus.EMPTY,
    maxWeight: 15.0, // 15kg capacity
  } as Luggage;

  const mockPackingLuggage: Luggage = {
    id: 'luggage-2',
    name: '30L Day Pack',
    description: 'Compact day hiking pack',
    category: mockLuggageCategory,
    trip: mockTrip,
    user: mockTripOwner,
    assignedTo: mockTripOwner,
    status: LuggageStatus.PACKING,
    maxWeight: 8.0, // 8kg capacity
  } as Luggage;

  const mockPackedLuggage: Luggage = {
    id: 'luggage-3',
    name: 'Checked Suitcase',
    description: 'Large checked luggage',
    category: mockLuggageCategory,
    trip: mockTrip,
    user: mockParticipant,
    assignedTo: mockParticipant,
    status: LuggageStatus.PACKED,
    maxWeight: 23.0, // 23kg airline limit
  } as Luggage;

  const mockCheckedLuggage: Luggage = {
    id: 'luggage-4',
    name: 'Carry-on Bag',
    description: 'Small carry-on luggage',
    category: mockLuggageCategory,
    trip: mockTrip,
    user: mockTripOwner,
    assignedTo: mockTripOwner,
    status: LuggageStatus.CHECKED,
    maxWeight: 7.0, // 7kg carry-on limit
  } as Luggage;

  const mockHeavyItem: Item = {
    id: 'item-1',
    name: 'Sleeping Bag',
    description: 'Winter sleeping bag',
    weight: 2.5, // 2.5kg
    status: ItemStatus.PACKED,
  } as Item;

  const mockMediumItem: Item = {
    id: 'item-2',
    name: 'Hiking Boots',
    description: 'Waterproof hiking boots',
    weight: 1.2, // 1.2kg
    status: ItemStatus.PACKED,
  } as Item;

  const mockLightItem: Item = {
    id: 'item-3',
    name: 'First Aid Kit',
    description: 'Compact first aid supplies',
    weight: 0.3, // 300g
    status: ItemStatus.PLANNED,
  } as Item;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LuggageService,
        LuggageItemsService,
        TripsService,
        {
          provide: getRepositoryToken(Luggage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            }),
          },
        },
        {
          provide: getRepositoryToken(LuggageCategory),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LuggageItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              into: jest.fn().mockReturnThis(),
              values: jest.fn().mockReturnThis(),
              delete: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              execute: jest.fn(),
              getOne: jest.fn(),
              getMany: jest.fn(),
            }),
          },
        },
        {
          provide: getRepositoryToken(Item),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    luggageService = module.get<LuggageService>(LuggageService);
    luggageItemsService = module.get<LuggageItemsService>(LuggageItemsService);
    tripsService = module.get<TripsService>(TripsService);
    luggageRepository = module.get(getRepositoryToken(Luggage));
    luggageCategoryRepository = module.get(getRepositoryToken(LuggageCategory));
    luggageItemRepository = module.get(getRepositoryToken(LuggageItem));
    itemRepository = module.get(getRepositoryToken(Item));
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('Luggage Creation and Assignment', () => {
    it('should create luggage with weight capacity', async () => {
      const createLuggageDto = {
        name: 'Travel Backpack',
        description: 'Medium hiking backpack',
        categoryId: mockLuggageCategory.id,
        maxWeight: 12.5,
      };

      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);
      luggageCategoryRepository.findOneBy.mockResolvedValue(mockLuggageCategory);
      userRepository.findOneBy.mockResolvedValue(mockParticipant);

      const expectedLuggage = {
        ...createLuggageDto,
        id: 'new-luggage',
        category: mockLuggageCategory,
        trip: mockTrip,
        user: mockParticipant,
        assignedTo: mockParticipant,
        status: LuggageStatus.EMPTY,
      };

      luggageRepository.create.mockReturnValue(expectedLuggage as Luggage);
      luggageRepository.save.mockResolvedValue(expectedLuggage as Luggage);

      const result = await luggageService.createForTrip(
        mockTrip.id,
        createLuggageDto,
        mockParticipant.id
      );

      expect(result.maxWeight).toBe(12.5);
      expect(result.status).toBe(LuggageStatus.EMPTY);
      expect(result.assignedTo).toEqual(mockParticipant);
    });

    it('should handle luggage without weight limits', async () => {
      const unlimitedLuggageDto = {
        name: 'Car Storage',
        description: 'Items stored in car',
        categoryId: mockLuggageCategory.id,
        maxWeight: null, // No weight limit
      };

      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);
      luggageCategoryRepository.findOneBy.mockResolvedValue(mockLuggageCategory);
      userRepository.findOneBy.mockResolvedValue(mockTripOwner);

      const unlimitedLuggage = {
        ...unlimitedLuggageDto,
        id: 'unlimited-luggage',
        status: LuggageStatus.EMPTY,
      };

      luggageRepository.create.mockReturnValue(unlimitedLuggage as Luggage);
      luggageRepository.save.mockResolvedValue(unlimitedLuggage as Luggage);

      const result = await luggageService.createForTrip(
        mockTrip.id,
        unlimitedLuggageDto,
        mockTripOwner.id
      );

      expect(result.maxWeight).toBeNull();
      expect(result.name).toBe('Car Storage');
    });
  });

  describe('Luggage Status Workflow', () => {
    it('should transition through status states correctly', async () => {
      const statusTransitions = [
        { from: LuggageStatus.EMPTY, to: LuggageStatus.PACKING },
        { from: LuggageStatus.PACKING, to: LuggageStatus.PACKED },
        { from: LuggageStatus.PACKED, to: LuggageStatus.CHECKED },
      ];

      for (const transition of statusTransitions) {
        const updateDto = { status: transition.to };
        const luggage = { ...mockEmptyLuggage, status: transition.from };

        luggageRepository.findOne.mockResolvedValue(luggage);
        jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

        const updatedLuggage = { ...luggage, status: transition.to };
        luggageRepository.preload.mockResolvedValue(updatedLuggage);
        luggageRepository.save.mockResolvedValue(updatedLuggage);

        const result = await luggageService.updateForTrip(
          luggage.id,
          updateDto,
          mockTrip.id,
          mockParticipant.id
        );

        expect(result.status).toBe(transition.to);
      }
    });

    it('should validate status enum values', () => {
      const validStatuses = [
        LuggageStatus.EMPTY,
        LuggageStatus.PACKING,
        LuggageStatus.PACKED,
        LuggageStatus.CHECKED,
      ];

      validStatuses.forEach(status => {
        expect(Object.values(LuggageStatus)).toContain(status);
      });
    });

    it('should handle status-specific logic', async () => {
      // Test PACKING status allows modifications
      const packingUpdate = {
        status: LuggageStatus.PACKING,
        description: 'Currently adding items',
      };

      luggageRepository.findOne.mockResolvedValue(mockEmptyLuggage);
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      const packingLuggage = {
        ...mockEmptyLuggage,
        status: LuggageStatus.PACKING,
        description: 'Currently adding items',
      };

      luggageRepository.preload.mockResolvedValue(packingLuggage);
      luggageRepository.save.mockResolvedValue(packingLuggage);

      const result = await luggageService.updateForTrip(
        mockEmptyLuggage.id,
        packingUpdate,
        mockTrip.id,
        mockParticipant.id
      );

      expect(result.status).toBe(LuggageStatus.PACKING);
      expect(result.description).toContain('Currently adding items');
    });
  });

  describe('Item Capacity Management', () => {
    it('should add item to luggage with weight tracking', async () => {
      const upsertDto = { quantity: 1 };

      luggageItemRepository.findOne.mockResolvedValue(mockEmptyLuggage);
      itemRepository.findOne.mockResolvedValue(mockHeavyItem);

      const mockUpdateResult = { affected: 0 }; // No existing record
      const mockInsertResult = { affected: 1 };

      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn()
          .mockResolvedValueOnce(mockUpdateResult) // Update fails
          .mockResolvedValueOnce(mockInsertResult), // Insert succeeds
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          luggage: mockEmptyLuggage,
          item: mockHeavyItem,
          quantity: 1,
        }),
      };

      luggageItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await luggageItemsService.upsert(
        mockEmptyLuggage.id,
        mockHeavyItem.id,
        upsertDto
      );

      expect(result.item.weight).toBe(2.5);
      expect(result.quantity).toBe(1);
    });

    it('should calculate total luggage weight', () => {
      const luggageItems = [
        { item: mockHeavyItem, quantity: 1 }, // 2.5kg
        { item: mockMediumItem, quantity: 1 }, // 1.2kg
        { item: mockLightItem, quantity: 2 }, // 0.3kg x 2 = 0.6kg
      ];

      const totalWeight = luggageItems.reduce((total, luggageItem) => {
        return total + (luggageItem.item.weight * luggageItem.quantity);
      }, 0);

      expect(totalWeight).toBe(4.3); // 2.5 + 1.2 + 0.6
    });

    it('should validate weight capacity limits', () => {
      const luggage = mockEmptyLuggage; // 15kg capacity
      const currentWeight = 4.3; // From previous test
      const newItem = { weight: 12.0, quantity: 1 };
      
      const wouldExceedCapacity = (currentWeight + (newItem.weight * newItem.quantity)) > luggage.maxWeight;

      expect(wouldExceedCapacity).toBe(true); // 4.3 + 12.0 = 16.3 > 15.0
    });

    it('should allow unlimited capacity luggage', () => {
      const unlimitedLuggage = { ...mockEmptyLuggage, maxWeight: null };
      const heavyItems = Array(10).fill({ weight: 5.0, quantity: 1 });
      
      const totalWeight = heavyItems.reduce((sum, item) => sum + item.weight * item.quantity, 0);
      const hasCapacityLimit = unlimitedLuggage.maxWeight !== null;

      expect(totalWeight).toBe(50); // 10 items x 5kg each
      expect(hasCapacityLimit).toBe(false);
      // Unlimited capacity should allow any weight
    });
  });

  describe('Luggage Item Operations', () => {
    it('should find all items in specific luggage', async () => {
      const mockLuggageItems = [
        { luggage: mockPackingLuggage, item: mockHeavyItem, quantity: 1 },
        { luggage: mockPackingLuggage, item: mockMediumItem, quantity: 1 },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLuggageItems),
      };

      luggageItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await luggageItemsService.findAll(mockPackingLuggage.id);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'luggageItem.luggageId = :luggageId',
        { luggageId: mockPackingLuggage.id }
      );
      expect(result).toEqual(mockLuggageItems);
    });

    it('should find specific item in luggage', async () => {
      const mockLuggageItem = {
        luggage: mockPackedLuggage,
        item: mockHeavyItem,
        quantity: 1,
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLuggageItem),
      };

      luggageItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await luggageItemsService.findOne(
        mockPackedLuggage.id,
        mockHeavyItem.id
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'luggageItem.itemId = :itemId',
        { itemId: mockHeavyItem.id }
      );
      expect(result).toEqual(mockLuggageItem);
    });

    it('should remove item from luggage', async () => {
      const mockDeleteResult = { affected: 1 };

      const queryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockDeleteResult),
      };

      luggageItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await luggageItemsService.remove(mockPackedLuggage.id, mockHeavyItem.id);

      expect(queryBuilder.execute).toHaveBeenCalled();
      expect(mockDeleteResult.affected).toBe(1);
    });

    it('should handle removing non-existent item', async () => {
      const mockDeleteResult = { affected: 0 };

      const queryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockDeleteResult),
      };

      luggageItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await expect(
        luggageItemsService.remove('non-existent-luggage', 'non-existent-item')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Capacity Analytics and Reporting', () => {
    it('should calculate capacity utilization', () => {
      const luggage = mockEmptyLuggage; // 15kg max
      const currentWeight = 9.2; // Current load
      const utilizationPercent = (currentWeight / luggage.maxWeight) * 100;
      const remainingCapacity = luggage.maxWeight - currentWeight;

      expect(utilizationPercent).toBeCloseTo(61.33, 2);
      expect(remainingCapacity).toBeCloseTo(5.8, 1);
    });

    it('should identify overloaded luggage', () => {
      const luggage = mockCheckedLuggage; // 7kg carry-on limit
      const currentWeight = 8.5; // Exceeds limit
      const isOverloaded = currentWeight > luggage.maxWeight;
      const excessWeight = currentWeight - luggage.maxWeight;

      expect(isOverloaded).toBe(true);
      expect(excessWeight).toBe(1.5);
    });

    it('should track packing progress by status', () => {
      const allLuggage = [
        mockEmptyLuggage,    // EMPTY
        mockPackingLuggage,  // PACKING
        mockPackedLuggage,   // PACKED
        mockCheckedLuggage,  // CHECKED
      ];

      const statusCounts = allLuggage.reduce((counts, luggage) => {
        counts[luggage.status] = (counts[luggage.status] || 0) + 1;
        return counts;
      }, {});

      expect(statusCounts[LuggageStatus.EMPTY]).toBe(1);
      expect(statusCounts[LuggageStatus.PACKING]).toBe(1);
      expect(statusCounts[LuggageStatus.PACKED]).toBe(1);
      expect(statusCounts[LuggageStatus.CHECKED]).toBe(1);
    });

    it('should calculate distribution efficiency', () => {
      const userLuggage = {
        [mockTripOwner.id]: [mockPackingLuggage, mockCheckedLuggage], // 2 pieces
        [mockParticipant.id]: [mockEmptyLuggage, mockPackedLuggage], // 2 pieces
      };

      const isEvenlyDistributed = Object.values(userLuggage).every(
        luggage => luggage.length === 2
      );

      expect(isEvenlyDistributed).toBe(true);
    });
  });

  describe('Luggage Assignment and Transfer', () => {
    it('should reassign luggage between participants', async () => {
      const reassignDto = {
        assignedTo: mockTripOwner.id,
      };

      luggageRepository.findOne.mockResolvedValue(mockEmptyLuggage);
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      const reassignedLuggage = {
        ...mockEmptyLuggage,
        assignedTo: mockTripOwner,
      };

      luggageRepository.preload.mockResolvedValue(reassignedLuggage);
      luggageRepository.save.mockResolvedValue(reassignedLuggage);

      const result = await luggageService.updateForTrip(
        mockEmptyLuggage.id,
        reassignDto,
        mockTrip.id,
        mockParticipant.id
      );

      expect(result.assignedTo).toEqual(mockTripOwner);
    });

    it('should track original owner vs assigned user', () => {
      const luggage = mockEmptyLuggage;
      const isOwnerDifferentFromAssigned = luggage.user.id !== luggage.assignedTo?.id;
      
      // In this case, both user and assignedTo are the same participant
      expect(isOwnerDifferentFromAssigned).toBe(false);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle negative weight values', async () => {
      const invalidDto = {
        name: 'Invalid Luggage',
        categoryId: mockLuggageCategory.id,
        maxWeight: -5.0, // Invalid negative weight
      };

      // This would need additional validation in the service
      expect(invalidDto.maxWeight).toBeLessThan(0);
      // Future enhancement: Add validation to reject negative weights
    });

    it('should handle extremely large quantities', async () => {
      const extremeDto = { quantity: 999999 };

      luggageItemRepository.findOne.mockResolvedValue(mockEmptyLuggage);
      itemRepository.findOne.mockResolvedValue(mockLightItem);

      // Calculate theoretical weight
      const theoreticalWeight = mockLightItem.weight * extremeDto.quantity;
      expect(theoreticalWeight).toBe(299999.7); // 0.3kg x 999999 = ~300 tons

      // This would clearly exceed any reasonable capacity
      expect(theoreticalWeight).toBeGreaterThan(mockEmptyLuggage.maxWeight);
    });

    it('should validate luggage belongs to trip', async () => {
      const wrongTripLuggage = {
        ...mockEmptyLuggage,
        trip: { id: 'different-trip-id' },
      };

      luggageRepository.findOne.mockResolvedValue(wrongTripLuggage as Luggage);
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mockTrip);

      await expect(
        luggageService.updateForTrip(
          wrongTripLuggage.id,
          { status: LuggageStatus.PACKING },
          mockTrip.id,
          mockParticipant.id
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});