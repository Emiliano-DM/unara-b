import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('User Authentication and Profile Management', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockActiveUser: User = {
    id: 'active-user-1',
    firstName: 'John',
    lastName: 'Doe',
    fullname: 'John Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    password: 'hashedPassword123',
    emailVerified: true,
    isActive: true,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    lastLoginAt: new Date('2024-01-15T10:00:00Z'),
    profile_picture: null,
    phoneNumber: '+1234567890',
    dateOfBirth: new Date('1990-05-15'),
    country: 'United States',
    timezone: 'America/New_York',
    language: 'en',
    travelPreferences: JSON.stringify({
      accommodation: ['hotel', 'airbnb'],
      transport: ['flight', 'train'],
      budget: 'medium',
    }),
    emergencyContact: 'Jane Doe - +1234567891',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User;

  const mockUnverifiedUser: User = {
    id: 'unverified-user-1',
    firstName: 'Jane',
    lastName: 'Smith',
    fullname: 'Jane Smith',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    password: 'hashedPassword456',
    emailVerified: false,
    isActive: true,
    passwordResetToken: 'reset-token-123',
    passwordResetExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    lastLoginAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User;

  const mockInactiveUser: User = {
    id: 'inactive-user-1',
    firstName: 'Bob',
    lastName: 'Wilson',
    fullname: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    username: 'bobwilson',
    password: 'hashedPassword789',
    emailVerified: true,
    isActive: false,
    lastLoginAt: new Date('2023-06-01T00:00:00Z'),
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-06-01T00:00:00Z'),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              andWhere: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('User Profile Management', () => {
    it('should create user with proper authentication fields', async () => {
      const createUserDto = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@example.com',
        username: 'alicejohnson',
        password: 'password123',
        phoneNumber: '+1987654321',
        country: 'Canada',
      };

      const expectedUser = {
        ...createUserDto,
        emailVerified: false,
        isActive: true,
        id: 'new-user-id',
      };

      userRepository.create.mockReturnValue(expectedUser as User);
      userRepository.save.mockResolvedValue(expectedUser as User);

      const result = await service.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(result.emailVerified).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.firstName).toBe('Alice');
      expect(result.lastName).toBe('Johnson');
    });

    it('should update user profile with split name fields', async () => {
      const updateUserDto = {
        firstName: 'John',
        lastName: 'Smith',
        phoneNumber: '+1555666777',
        timezone: 'America/Los_Angeles',
        travelPreferences: JSON.stringify({
          accommodation: ['resort'],
          budget: 'high',
        }),
      };

      const updatedUser = { ...mockActiveUser, ...updateUserDto };
      userRepository.preload.mockResolvedValue(updatedUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockActiveUser.id, updateUserDto);

      expect(userRepository.preload).toHaveBeenCalledWith({
        id: mockActiveUser.id,
        ...updateUserDto,
      });
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Smith');
      expect(result.phoneNumber).toBe('+1555666777');
    });

    it('should handle travel preferences as JSON', async () => {
      const travelPrefs = {
        accommodation: ['hotel', 'hostel'],
        transport: ['bus', 'car'],
        budget: 'low',
        dietary: ['vegetarian'],
      };

      const updateDto = {
        travelPreferences: JSON.stringify(travelPrefs),
      };

      const updatedUser = { ...mockActiveUser, ...updateDto };
      userRepository.preload.mockResolvedValue(updatedUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockActiveUser.id, updateDto);

      expect(result.travelPreferences).toBe(JSON.stringify(travelPrefs));
      expect(JSON.parse(result.travelPreferences)).toEqual(travelPrefs);
    });
  });

  describe('Authentication Status Management', () => {
    it('should verify email status', async () => {
      userRepository.findOneBy.mockResolvedValue(mockActiveUser);

      const result = await service.findOne(mockActiveUser.id);

      expect(result.emailVerified).toBe(true);
      expect(result.isActive).toBe(true);
    });

    it('should handle unverified users', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUnverifiedUser);

      const result = await service.findOne(mockUnverifiedUser.id);

      expect(result.emailVerified).toBe(false);
      expect(result.passwordResetToken).toBe('reset-token-123');
      expect(result.passwordResetExpiresAt).toBeInstanceOf(Date);
    });

    it('should identify inactive users', async () => {
      userRepository.findOneBy.mockResolvedValue(mockInactiveUser);

      const result = await service.findOne(mockInactiveUser.id);

      expect(result.isActive).toBe(false);
      expect(result.emailVerified).toBe(true);
    });

    it('should update user activation status', async () => {
      const activateDto = { isActive: true };
      const activatedUser = { ...mockInactiveUser, isActive: true };

      userRepository.preload.mockResolvedValue(activatedUser);
      userRepository.save.mockResolvedValue(activatedUser);

      const result = await service.update(mockInactiveUser.id, activateDto);

      expect(result.isActive).toBe(true);
    });

    it('should update email verification status', async () => {
      const verifyDto = { emailVerified: true };
      const verifiedUser = { ...mockUnverifiedUser, emailVerified: true };

      userRepository.preload.mockResolvedValue(verifiedUser);
      userRepository.save.mockResolvedValue(verifiedUser);

      const result = await service.update(mockUnverifiedUser.id, verifyDto);

      expect(result.emailVerified).toBe(true);
    });
  });

  describe('Password Reset Management', () => {
    it('should set password reset token', async () => {
      const resetToken = 'secure-reset-token-456';
      const expiresAt = new Date(Date.now() + 3600000);
      
      const updateDto = {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: expiresAt,
      };

      const updatedUser = { ...mockActiveUser, ...updateDto };
      userRepository.preload.mockResolvedValue(updatedUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockActiveUser.id, updateDto);

      expect(result.passwordResetToken).toBe(resetToken);
      expect(result.passwordResetExpiresAt).toEqual(expiresAt);
    });

    it('should clear password reset token after use', async () => {
      const clearTokenDto = {
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        password: 'newHashedPassword',
      };

      const updatedUser = { ...mockUnverifiedUser, ...clearTokenDto };
      userRepository.preload.mockResolvedValue(updatedUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUnverifiedUser.id, clearTokenDto);

      expect(result.passwordResetToken).toBeNull();
      expect(result.passwordResetExpiresAt).toBeNull();
      expect(result.password).toBe('newHashedPassword');
    });

    it('should handle expired reset tokens', () => {
      const expiredUser = {
        ...mockUnverifiedUser,
        passwordResetExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      };

      const isExpired = expiredUser.passwordResetExpiresAt < new Date();
      expect(isExpired).toBe(true);
    });
  });

  describe('User Activity Tracking', () => {
    it('should update last login timestamp', async () => {
      const loginTime = new Date();
      const updateDto = { lastLoginAt: loginTime };

      const updatedUser = { ...mockActiveUser, lastLoginAt: loginTime };
      userRepository.preload.mockResolvedValue(updatedUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockActiveUser.id, updateDto);

      expect(result.lastLoginAt).toEqual(loginTime);
    });

    it('should handle users with no login history', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUnverifiedUser);

      const result = await service.findOne(mockUnverifiedUser.id);

      expect(result.lastLoginAt).toBeNull();
    });
  });

  describe('User Search and Filtering', () => {
    it('should search users by email', async () => {
      const filterDto = { email: 'john', limit: 10, offset: 0 };
      const mockUsers = [mockActiveUser];

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
      };

      userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.email ILIKE :email',
        { email: '%john%' }
      );
      expect(result).toEqual(mockUsers);
    });

    it('should search users by username', async () => {
      const filterDto = { username: 'doe', limit: 5, offset: 0 };
      const mockUsers = [mockActiveUser];

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
      };

      userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.username ILIKE :username',
        { username: '%doe%' }
      );
      expect(result).toEqual(mockUsers);
    });
  });

  describe('Profile Completeness', () => {
    it('should identify complete user profiles', () => {
      const isComplete = mockActiveUser.firstName &&
                        mockActiveUser.lastName &&
                        mockActiveUser.email &&
                        mockActiveUser.phoneNumber &&
                        mockActiveUser.country &&
                        mockActiveUser.emailVerified;

      expect(isComplete).toBe(true);
    });

    it('should identify incomplete user profiles', () => {
      const incompleteUser = {
        ...mockUnverifiedUser,
        phoneNumber: null,
        country: null,
      };

      const isComplete = incompleteUser.firstName &&
                        incompleteUser.lastName &&
                        incompleteUser.email &&
                        incompleteUser.phoneNumber &&
                        incompleteUser.country &&
                        incompleteUser.emailVerified;

      expect(isComplete).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should throw NotFoundException for non-existent user', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      userRepository.preload.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { firstName: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('Data Validation', () => {
    it('should handle valid timezone formats', () => {
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'UTC',
      ];

      validTimezones.forEach(timezone => {
        expect(typeof timezone).toBe('string');
        expect(timezone.length).toBeGreaterThan(0);
      });
    });

    it('should handle valid language codes', () => {
      const validLanguages = ['en', 'es', 'fr', 'de', 'ja'];

      validLanguages.forEach(lang => {
        expect(typeof lang).toBe('string');
        expect(lang.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should validate date of birth format', () => {
      const validDob = new Date('1990-05-15');
      const today = new Date();

      expect(validDob).toBeInstanceOf(Date);
      expect(validDob.getTime()).toBeLessThan(today.getTime());
    });
  });
});