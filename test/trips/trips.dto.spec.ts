import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateTripDto } from '../../src/trips/dto/create-trip.dto';
import { UpdateTripDto } from '../../src/trips/dto/update-trip.dto';
import { FilterTripDto } from '../../src/trips/dto/filter-trip.dto';
import { InviteParticipantDto } from '../../src/trips/dto/invite-participant.dto';
import { UpdateParticipantRoleDto } from '../../src/trips/dto/update-participant-role.dto';

describe('Trips DTOs Validation', () => {
  describe('CreateTripDto', () => {
    it('should validate a valid trip creation', async () => {
      const dto = new CreateTripDto();
      dto.name = 'Test Trip';
      dto.description = 'Test Description';
      dto.destination = 'Test Destination';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when name is empty', async () => {
      const dto = new CreateTripDto();
      dto.name = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation when name is too long', async () => {
      const dto = new CreateTripDto();
      dto.name = 'a'.repeat(256); // Exceeds maxLength of 255

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should allow optional fields', async () => {
      const dto = new CreateTripDto();
      dto.name = 'Minimal Trip';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateTripDto', () => {
    it('should validate status field', async () => {
      const dto = new UpdateTripDto();
      dto.status = 'active';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid status', async () => {
      const dto = new UpdateTripDto();
      dto.status = 'invalid-status';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('FilterTripDto', () => {
    it('should validate optional search parameters', async () => {
      const dto = new FilterTripDto();
      dto.search = 'test';
      dto.status = 'planning';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate boolean fields', async () => {
      const dto = new FilterTripDto();
      dto.isOwner = true;
      dto.isParticipant = false;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('InviteParticipantDto', () => {
    it('should validate UUID userId', async () => {
      const dto = new InviteParticipantDto();
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.role = 'participant';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid UUID', async () => {
      const dto = new InviteParticipantDto();
      dto.userId = 'invalid-uuid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation for invalid role', async () => {
      const dto = new InviteParticipantDto();
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.role = 'owner'; // Not allowed

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('role');
    });
  });

  describe('UpdateParticipantRoleDto', () => {
    it('should validate valid roles', async () => {
      const dto = new UpdateParticipantRoleDto();
      dto.role = 'admin';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid role', async () => {
      const dto = new UpdateParticipantRoleDto();
      dto.role = 'owner'; // Not allowed in updates

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('role');
    });

    it('should fail validation when role is empty', async () => {
      const dto = new UpdateParticipantRoleDto();
      dto.role = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('role');
    });
  });
});