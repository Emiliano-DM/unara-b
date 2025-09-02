import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as request from 'supertest';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { User } from '../../src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('Auth Integration', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.username).toBe(registerDto.username);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, username: 'differentuser' })
        .expect(400);
    });

    it('should reject invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(loginDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/social (POST)', () => {
    it('should create new user from Google social auth', async () => {
      const socialAuthDto = {
        provider: 'google',
        access_token: 'fake-google-token',
        user_info: {
          sub: 'google-123',
          email: 'google@example.com',
          name: 'Google User',
          given_name: 'Google',
          family_name: 'User',
          picture: 'https://example.com/picture.jpg',
        },
      };

      // Mock the token validator to return true for testing
      jest.spyOn(app.get('SocialTokenValidatorService'), 'validateToken')
        .mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/social')
        .send(socialAuthDto)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(socialAuthDto.user_info.email);
      expect(response.body.user.socialProvider).toBe('google');
    });

    it('should reject invalid social auth token', async () => {
      const socialAuthDto = {
        provider: 'google',
        access_token: 'invalid-token',
        user_info: {
          sub: 'google-123',
          email: 'google@example.com',
          name: 'Google User',
        },
      };

      // Mock the token validator to return false
      jest.spyOn(app.get('SocialTokenValidatorService'), 'validateToken')
        .mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/auth/social')
        .send(socialAuthDto)
        .expect(401);
    });

    it('should reject social auth without email', async () => {
      const socialAuthDto = {
        provider: 'google',
        access_token: 'fake-google-token',
        user_info: {
          sub: 'google-123',
          name: 'Google User',
          // Missing email
        },
      };

      await request(app.getHttpServer())
        .post('/auth/social')
        .send(socialAuthDto)
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and get refresh token
      const socialAuthDto = {
        provider: 'google',
        access_token: 'fake-google-token',
        user_info: {
          sub: 'google-123',
          email: 'refresh@example.com',
          name: 'Refresh User',
        },
      };

      jest.spyOn(app.get('SocialTokenValidatorService'), 'validateToken')
        .mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/social')
        .send(socialAuthDto);

      refreshToken = response.body.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const refreshDto = {
        refresh_token: refreshToken,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('refresh@example.com');
    });

    it('should reject invalid refresh token', async () => {
      const refreshDto = {
        refresh_token: 'invalid-refresh-token',
      };

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create user and get access token
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'profile@example.com',
          username: 'profileuser',
          password: 'Password123!',
        });

      accessToken = registerResponse.body.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe('profile@example.com');
      expect(response.body.username).toBe('profileuser');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      // Create test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'reset@example.com',
          username: 'resetuser',
          password: 'OldPassword123!',
        });
    });

    it('should handle forgot password request', async () => {
      const forgotPasswordDto = {
        email: 'reset@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordDto)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('password reset');
    });

    it('should not reveal if email does not exist', async () => {
      const forgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordDto)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      // Should return same message regardless of email existence
    });
  });
});