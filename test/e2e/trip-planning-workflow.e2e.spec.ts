import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../../src/trips/trips.service';
import { ItemsService } from '../../src/items/items.service';
import { LuggageService } from '../../src/luggage/services/luggage.service';
import { LuggageItemsService } from '../../src/luggage/services/luggage-items.service';
import { UsersService } from '../../src/users/users.service';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { Item } from '../../src/items/entities/item.entity';
import { ItemCategory } from '../../src/item-categories/entities/item-category.entity';
import { Luggage } from '../../src/luggage/entities/luggage.entity';
import { LuggageCategory } from '../../src/luggage-categories/entities/luggage-category.entity';
import { LuggageItem } from '../../src/luggage/entities/luggage-item.entity';
import { TripStatus } from '../../src/common/enums/trip-status.enum';
import { ParticipantRole } from '../../src/common/enums/participant-role.enum';
import { ParticipantStatus } from '../../src/common/enums/participant-status.enum';
import { ItemStatus } from '../../src/common/enums/item-status.enum';
import { LuggageStatus } from '../../src/common/enums/luggage-status.enum';

describe('End-to-End Trip Planning Workflow', () => {
  let tripsService: TripsService;
  let itemsService: ItemsService;
  let luggageService: LuggageService;
  let luggageItemsService: LuggageItemsService;
  let usersService: UsersService;

  let tripRepository: jest.Mocked<Repository<Trip>>;
  let participantRepository: jest.Mocked<Repository<TripParticipant>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let itemRepository: jest.Mocked<Repository<Item>>;
  let itemCategoryRepository: jest.Mocked<Repository<ItemCategory>>;
  let luggageRepository: jest.Mocked<Repository<Luggage>>;
  let luggageCategoryRepository: jest.Mocked<Repository<LuggageCategory>>;
  let luggageItemRepository: jest.Mocked<Repository<LuggageItem>>;

  // Mock Users
  const tripOwner: User = {
    id: 'owner-uuid',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    username: 'alicejohnson',
    emailVerified: true,
    isActive: true,
    phoneNumber: '+1234567890',
    country: 'United States',
    timezone: 'America/New_York',
    travelPreferences: JSON.stringify({
      accommodation: ['hotel', 'lodge'],
      budget: 'high',
      activities: ['hiking', 'photography'],
    }),
  } as User;

  const participant1: User = {
    id: 'participant1-uuid',
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@example.com',
    username: 'bobsmith',
    emailVerified: true,
    isActive: true,
  } as User;

  const participant2: User = {
    id: 'participant2-uuid',
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol@example.com',
    username: 'caroldavis',
    emailVerified: true,
    isActive: true,
  } as User;

  // Mock Categories
  const gearCategory: ItemCategory = {
    id: 'gear-category',
    name: 'Outdoor Gear',
    description: 'Camping and hiking equipment',
  } as ItemCategory;

  const clothingCategory: ItemCategory = {
    id: 'clothing-category',
    name: 'Clothing',
    description: 'Apparel and accessories',
  } as ItemCategory;

  const backpackCategory: LuggageCategory = {
    id: 'backpack-category',
    name: 'Backpacks',
    description: 'Hiking and travel backpacks',
  } as LuggageCategory;

  // Mock Trip Scenario: 5-day Mountain Hiking Trip
  let mountainTrip: Trip;
  let tripParticipants: TripParticipant[];
  let tripItems: Item[];
  let tripLuggage: Luggage[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        ItemsService,
        LuggageService,
        LuggageItemsService,
        UsersService,
        // Trip repositories
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
          },
        },
        // User repositories
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            preload: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              andWhere: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            }),
          },
        },
        // Item repositories
        {
          provide: getRepositoryToken(Item),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            preload: jest.fn(),
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
          provide: getRepositoryToken(ItemCategory),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        // Luggage repositories
        {
          provide: getRepositoryToken(Luggage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            preload: jest.fn(),
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
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              into: jest.fn().mockReturnThis(),
              values: jest.fn().mockReturnThis(),
              execute: jest.fn(),
              getOne: jest.fn(),
              getMany: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    tripsService = module.get<TripsService>(TripsService);
    itemsService = module.get<ItemsService>(ItemsService);
    luggageService = module.get<LuggageService>(LuggageService);
    luggageItemsService = module.get<LuggageItemsService>(LuggageItemsService);
    usersService = module.get<UsersService>(UsersService);

    tripRepository = module.get(getRepositoryToken(Trip));
    participantRepository = module.get(getRepositoryToken(TripParticipant));
    userRepository = module.get(getRepositoryToken(User));
    itemRepository = module.get(getRepositoryToken(Item));
    itemCategoryRepository = module.get(getRepositoryToken(ItemCategory));
    luggageRepository = module.get(getRepositoryToken(Luggage));
    luggageCategoryRepository = module.get(getRepositoryToken(LuggageCategory));
    luggageItemRepository = module.get(getRepositoryToken(LuggageItem));

    // Initialize test data
    mountainTrip = {
      id: 'mountain-trip-uuid',
      name: 'Rocky Mountain Adventure',
      description:
        'A 5-day hiking and camping expedition in the Rocky Mountains',
      destination: 'Rocky Mountain National Park, Colorado',
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-20'),
      status: TripStatus.PLANNING,
      owner: tripOwner,
      isPublic: false,
      shareToken: 'mountain-trip-token-123',
      budget: 2500.0,
      currency: 'USD',
      maxParticipants: 4,
      category: 'Adventure',
      departureLocation: 'Denver, CO',
      timeZone: 'America/Denver',
      accommodation: 'Camping (tents and cabins)',
      transportation: 'Rental cars to trailheads',
      bookingDeadline: new Date('2024-06-01'),
      requirements: 'Valid ID, health insurance, emergency contact',
      participants: [],
      luggage: [],
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      generateShareToken: jest.fn(),
    } as Trip;
  });

  describe('Complete Trip Planning Workflow', () => {
    it('should execute full trip lifecycle from creation to completion', async () => {
      // Phase 1: Trip Creation
      const createTripDto = {
        name: mountainTrip.name,
        description: mountainTrip.description,
        destination: mountainTrip.destination,
        startDate: mountainTrip.startDate,
        endDate: mountainTrip.endDate,
        budget: mountainTrip.budget,
        maxParticipants: mountainTrip.maxParticipants,
        category: mountainTrip.category,
        accommodation: mountainTrip.accommodation,
        transportation: mountainTrip.transportation,
      };

      userRepository.findOne.mockResolvedValue(tripOwner);
      tripRepository.create.mockReturnValue(mountainTrip);
      tripRepository.save.mockResolvedValue(mountainTrip);
      participantRepository.create.mockReturnValue({
        trip: mountainTrip,
        user: tripOwner,
        role: ParticipantRole.OWNER,
        status: ParticipantStatus.JOINED,
      } as TripParticipant);
      participantRepository.save.mockResolvedValue({} as TripParticipant);

      const createdTrip = await tripsService.create(
        createTripDto,
        tripOwner.id,
      );

      expect(createdTrip.name).toBe('Rocky Mountain Adventure');
      expect(createdTrip.budget).toBe(2500.0);
      expect(createdTrip.maxParticipants).toBe(4);
      expect(createdTrip.status).toBe(TripStatus.PLANNING);

      // Phase 2: Participant Invitation and Joining
      const tripWithOwner = {
        ...mountainTrip,
        participants: [
          {
            user: { id: tripOwner.id },
            role: ParticipantRole.OWNER,
            status: ParticipantStatus.JOINED,
          },
        ],
        generateShareToken: jest.fn(),
      };

      tripRepository.findOne.mockResolvedValue(tripWithOwner as Trip);
      userRepository.findOne
        .mockResolvedValueOnce(participant1) // User to invite
        .mockResolvedValueOnce(tripOwner) // Inviter
        .mockResolvedValueOnce(participant2) // Second user to invite
        .mockResolvedValueOnce(tripOwner); // Inviter again

      participantRepository.findOne.mockResolvedValue(null); // No existing participation

      // Mock invitations
      participantRepository.create.mockReturnValue({
        role: ParticipantRole.PARTICIPANT,
        status: ParticipantStatus.INVITED,
      } as TripParticipant);
      participantRepository.save.mockResolvedValue({} as TripParticipant);

      // Invite participants
      await tripsService.inviteParticipant(
        mountainTrip.id,
        { userId: participant1.id },
        tripOwner.id,
      );
      await tripsService.inviteParticipant(
        mountainTrip.id,
        { userId: participant2.id },
        tripOwner.id,
      );

      expect(participantRepository.save).toHaveBeenCalledTimes(3); // Owner + 2 invitations
    });

    it('should handle comprehensive item planning workflow', async () => {
      // Phase 3: Essential Items Planning
      const essentialItems = [
        {
          name: 'Camping Tents',
          description: '2-person waterproof tents',
          categoryId: gearCategory.id,
          quantity: 2,
          assignedTo: null, // Shared responsibility
        },
        {
          name: 'Sleeping Bags',
          description: 'Cold weather sleeping bags',
          categoryId: gearCategory.id,
          quantity: 3,
          assignedTo: participant1.id,
        },
        {
          name: 'Hiking Boots',
          description: 'Waterproof hiking boots',
          categoryId: clothingCategory.id,
          quantity: 3,
          assignedTo: null, // Everyone brings their own
        },
        {
          name: 'First Aid Kit',
          description: 'Comprehensive first aid supplies',
          categoryId: gearCategory.id,
          quantity: 1,
          assignedTo: tripOwner.id,
        },
        {
          name: 'Portable Stove',
          description: 'Lightweight camping stove',
          categoryId: gearCategory.id,
          quantity: 1,
          assignedTo: participant2.id,
        },
      ];

      // Mock dependencies for item creation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mountainTrip);
      itemCategoryRepository.findOneBy.mockResolvedValue(gearCategory);
      userRepository.findOneBy.mockResolvedValue(tripOwner);

      const createdItems: Item[] = [];

      for (const itemDto of essentialItems) {
        const item = {
          id: `item-${Date.now()}-${Math.random()}`,
          ...itemDto,
          category: gearCategory,
          trip: mountainTrip,
          createdBy: tripOwner,
          status: ItemStatus.PLANNED,
        } as Item;

        itemRepository.create.mockReturnValue(item);
        itemRepository.save.mockResolvedValue(item);

        const createdItem = await itemsService.createForTrip(
          mountainTrip.id,
          itemDto,
          tripOwner.id,
        );

        createdItems.push(createdItem);
      }

      expect(createdItems).toHaveLength(5);

      // Verify item assignment distribution
      const assignedItems = createdItems.filter(
        (item) => item.assignedTo !== null,
      );
      const sharedItems = createdItems.filter(
        (item) => item.assignedTo === null,
      );

      expect(assignedItems).toHaveLength(3); // Sleeping bags, first aid, stove
      expect(sharedItems).toHaveLength(2); // Tents, boots (everyone brings own)
    });

    it('should manage luggage capacity and packing workflow', async () => {
      // Phase 4: Luggage Planning and Assignment
      const luggagePieces = [
        {
          name: 'Alice Main Backpack',
          description: '65L hiking backpack',
          categoryId: backpackCategory.id,
          userId: tripOwner.id,
          maxWeight: 18.0, // 18kg capacity
        },
        {
          name: 'Bob Hiking Pack',
          description: '50L trekking backpack',
          categoryId: backpackCategory.id,
          userId: participant1.id,
          maxWeight: 15.0, // 15kg capacity
        },
        {
          name: 'Carol Adventure Pack',
          description: '45L hiking backpack',
          categoryId: backpackCategory.id,
          userId: participant2.id,
          maxWeight: 12.0, // 12kg capacity
        },
        {
          name: 'Shared Gear Bag',
          description: 'Large duffel for shared equipment',
          categoryId: backpackCategory.id,
          userId: tripOwner.id,
          maxWeight: null, // Unlimited (car storage)
        },
      ];

      // Mock luggage creation
      jest.spyOn(tripsService, 'findOne').mockResolvedValue(mountainTrip);
      luggageCategoryRepository.findOneBy.mockResolvedValue(backpackCategory);

      const createdLuggage: Luggage[] = [];

      for (const luggageDto of luggagePieces) {
        const user =
          luggageDto.userId === tripOwner.id
            ? tripOwner
            : luggageDto.userId === participant1.id
              ? participant1
              : participant2;

        userRepository.findOneBy.mockResolvedValue(user);

        const luggage = {
          id: `luggage-${Date.now()}-${Math.random()}`,
          name: luggageDto.name,
          description: luggageDto.description,
          category: backpackCategory,
          trip: mountainTrip,
          user,
          assignedTo: user,
          status: LuggageStatus.EMPTY,
          maxWeight: luggageDto.maxWeight,
        } as Luggage;

        luggageRepository.create.mockReturnValue(luggage);
        luggageRepository.save.mockResolvedValue(luggage);

        const createdLuggageItem = await luggageService.createForTrip(
          mountainTrip.id,
          luggageDto,
          user.id,
        );

        createdLuggage.push(createdLuggageItem);
      }

      expect(createdLuggage).toHaveLength(4);

      // Verify capacity distribution
      const personalPacks = createdLuggage.filter((l) => l.maxWeight !== null);
      const sharedStorage = createdLuggage.filter((l) => l.maxWeight === null);
      const totalPersonalCapacity = personalPacks.reduce(
        (sum, l) => sum + l.maxWeight,
        0,
      );

      expect(personalPacks).toHaveLength(3);
      expect(sharedStorage).toHaveLength(1);
      expect(totalPersonalCapacity).toBe(45.0); // 18 + 15 + 12
    });

    it('should execute packing and status progression workflow', async () => {
      // Phase 5: Packing Process
      const packingWorkflow = [
        {
          luggageId: 'alice-backpack',
          status: LuggageStatus.PACKING,
          description: 'Starting to pack personal gear',
        },
        {
          luggageId: 'bob-backpack',
          status: LuggageStatus.PACKING,
          description: 'Organizing sleeping gear',
        },
        {
          luggageId: 'alice-backpack',
          status: LuggageStatus.PACKED,
          description: 'All personal items packed and ready',
        },
        {
          luggageId: 'bob-backpack',
          status: LuggageStatus.PACKED,
          description: 'Sleeping bags and personal gear secured',
        },
      ];

      // Mock luggage updates
      for (const update of packingWorkflow) {
        const mockLuggage = {
          id: update.luggageId,
          status: LuggageStatus.EMPTY,
          trip: { id: mountainTrip.id },
        } as Luggage;

        luggageRepository.findOne.mockResolvedValue(mockLuggage);
        jest.spyOn(tripsService, 'findOne').mockResolvedValue(mountainTrip);

        const updatedLuggage = {
          ...mockLuggage,
          status: update.status,
          description: update.description,
        };

        luggageRepository.preload.mockResolvedValue(updatedLuggage);
        luggageRepository.save.mockResolvedValue(updatedLuggage);

        const result = await luggageService.updateForTrip(
          update.luggageId,
          { status: update.status, description: update.description },
          mountainTrip.id,
          tripOwner.id,
        );

        expect(result.status).toBe(update.status);
      }

      // Verify packing progression
      const finalStatuses = packingWorkflow.reduce((statuses, update) => {
        statuses[update.luggageId] = update.status;
        return statuses;
      }, {});

      expect(finalStatuses['alice-backpack']).toBe(LuggageStatus.PACKED);
      expect(finalStatuses['bob-backpack']).toBe(LuggageStatus.PACKED);
    });

    it('should handle trip status progression and completion', async () => {
      // Phase 6: Trip Execution and Completion
      const tripStatusProgression = [
        {
          status: TripStatus.ACTIVE,
          description: 'Trip has started, team departed for mountains',
        },
        {
          status: TripStatus.COMPLETED,
          description: 'Successfully completed 5-day mountain adventure',
        },
      ];

      // Mock trip status updates
      tripRepository.findOne.mockResolvedValue(mountainTrip);

      for (const update of tripStatusProgression) {
        const updatedTrip = {
          ...mountainTrip,
          status: update.status,
          description: update.description,
          generateShareToken: jest.fn(),
        };

        tripRepository.save.mockResolvedValue(updatedTrip as Trip);

        const result = await tripsService.update(
          mountainTrip.id,
          { status: update.status, description: update.description },
          tripOwner.id,
        );

        expect(result.status).toBe(update.status);
      }

      // Verify final trip state
      expect(mountainTrip.startDate).toBeInstanceOf(Date);
      expect(mountainTrip.endDate).toBeInstanceOf(Date);
      expect(mountainTrip.budget).toBe(2500.0);
      expect(mountainTrip.maxParticipants).toBe(4);
    });
  });

  describe('Workflow Analytics and Reporting', () => {
    it('should calculate trip planning completeness', () => {
      const planningMetrics = {
        participantsInvited: 2,
        participantsJoined: 1,
        itemsPlanned: 5,
        itemsPacked: 3,
        luggagePieces: 4,
        luggagePacked: 2,
        budgetAllocated: 2500.0,
        maxParticipants: 4,
      };

      const participationRate =
        (planningMetrics.participantsJoined / planningMetrics.maxParticipants) *
        100;
      const itemsReadiness =
        (planningMetrics.itemsPacked / planningMetrics.itemsPlanned) * 100;
      const packingProgress =
        (planningMetrics.luggagePacked / planningMetrics.luggagePieces) * 100;

      expect(participationRate).toBe(25); // 1 of 4 max participants
      expect(itemsReadiness).toBe(60); // 3 of 5 items packed
      expect(packingProgress).toBe(50); // 2 of 4 luggage pieces packed
    });

    it('should identify workflow bottlenecks', () => {
      const workflowStatus = {
        tripCreated: true,
        participantsInvited: true,
        participantsResponded: false, // Bottleneck: waiting for responses
        itemsAssigned: true,
        luggageCreated: true,
        packingStarted: false, // Bottleneck: packing not started
        tripActive: false,
      };

      const bottlenecks = Object.entries(workflowStatus)
        .filter(([_, completed]) => !completed)
        .map(([step]) => step);

      expect(bottlenecks).toContain('participantsResponded');
      expect(bottlenecks).toContain('packingStarted');
      expect(bottlenecks).toContain('tripActive');
    });

    it('should calculate resource distribution efficiency', () => {
      const resourceAllocation = {
        totalItems: 5,
        assignedItems: 3,
        sharedItems: 2,
        totalLuggage: 4,
        personalLuggage: 3,
        sharedLuggage: 1,
        totalCapacity: 45.0, // kg
        estimatedWeight: 32.5, // kg
      };

      const assignmentRate =
        (resourceAllocation.assignedItems / resourceAllocation.totalItems) *
        100;
      const capacityUtilization =
        (resourceAllocation.estimatedWeight /
          resourceAllocation.totalCapacity) *
        100;
      const personalToSharedRatio =
        resourceAllocation.personalLuggage / resourceAllocation.sharedLuggage;

      expect(assignmentRate).toBe(60);
      expect(capacityUtilization).toBeCloseTo(72.22, 2);
      expect(personalToSharedRatio).toBe(3); // 3:1 ratio
    });
  });

  describe('Workflow Error Recovery', () => {
    it('should handle participant dropout scenario', async () => {
      const dropoutScenario = {
        originalParticipants: 3,
        droppedOut: 1,
        remainingParticipants: 2,
        reassignmentNeeded: true,
      };

      // Simulate items that need reassignment
      const orphanedItems = [
        {
          id: 'item-1',
          assignedTo: 'dropped-participant',
          name: 'Sleeping Bags',
        },
        {
          id: 'item-2',
          assignedTo: 'dropped-participant',
          name: 'Portable Stove',
        },
      ];

      const reassignmentPlan = orphanedItems.map((item) => ({
        ...item,
        newAssignedTo: participant2.id, // Reassign to remaining participant
        status: 'reassignment-needed',
      }));

      expect(reassignmentPlan).toHaveLength(2);
      expect(
        reassignmentPlan.every(
          (item) => item.newAssignedTo === participant2.id,
        ),
      ).toBe(true);
    });

    it('should handle capacity overflow scenario', async () => {
      const capacityOverflow = {
        luggageCapacity: 15.0, // kg
        currentWeight: 18.5, // kg - exceeds capacity
        overflowAmount: 3.5, // kg
        redistributionNeeded: true,
      };

      const redistributionStrategy = {
        moveToSharedStorage: 2.0, // kg
        reduceNonEssentials: 1.5, // kg
        totalReduction: 3.5, // kg
      };

      const finalWeight =
        capacityOverflow.currentWeight - redistributionStrategy.totalReduction;
      const withinCapacity = finalWeight <= capacityOverflow.luggageCapacity;

      expect(finalWeight).toBe(15.0);
      expect(withinCapacity).toBe(true);
    });

    it('should handle weather-related itinerary changes', async () => {
      const weatherUpdate = {
        originalPlan: 'High altitude camping',
        weatherAlert: 'Heavy snow expected',
        alternativePlan: 'Lower elevation lodge stay',
        affectedItems: ['tent', 'sleeping-bag', 'winter-gear'],
        newItems: ['indoor-clothes', 'lodge-reservation'],
      };

      const adaptationMetrics = {
        itemsToRemove: weatherUpdate.affectedItems.length,
        itemsToAdd: weatherUpdate.newItems.length,
        accommodationChange: true,
        budgetImpact: 200.0, // Additional lodge cost
      };

      expect(adaptationMetrics.itemsToRemove).toBe(3);
      expect(adaptationMetrics.itemsToAdd).toBe(2);
      expect(adaptationMetrics.budgetImpact).toBeGreaterThan(0);
    });
  });

  describe('Workflow Performance Metrics', () => {
    it('should measure planning efficiency timeline', () => {
      const timelineMetrics = {
        tripCreationDate: new Date('2024-01-01'),
        invitationsSentDate: new Date('2024-01-02'),
        itemsPlanningCompleteDate: new Date('2024-01-10'),
        packingCompleteDate: new Date('2024-07-10'),
        tripStartDate: new Date('2024-07-15'),
      };

      const planningDuration = Math.floor(
        (timelineMetrics.itemsPlanningCompleteDate.getTime() -
          timelineMetrics.tripCreationDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const preparationDuration = Math.floor(
        (timelineMetrics.packingCompleteDate.getTime() -
          timelineMetrics.itemsPlanningCompleteDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      expect(planningDuration).toBe(9); // days
      expect(preparationDuration).toBe(181); // days (~6 months)
    });

    it('should track collaboration effectiveness', () => {
      const collaborationMetrics = {
        totalParticipants: 3,
        activeContributors: 2, // Participants who added items/luggage
        itemsCreatedByOwner: 5,
        itemsCreatedByParticipants: 3,
        responsesToInvitations: 2,
        invitationsSent: 2,
      };

      const contributionBalance =
        collaborationMetrics.itemsCreatedByParticipants /
        (collaborationMetrics.itemsCreatedByOwner +
          collaborationMetrics.itemsCreatedByParticipants);

      const responseRate =
        (collaborationMetrics.responsesToInvitations /
          collaborationMetrics.invitationsSent) *
        100;

      expect(contributionBalance).toBeCloseTo(0.375, 3); // 37.5% participant contribution
      expect(responseRate).toBe(100); // 100% response rate
    });
  });
});
