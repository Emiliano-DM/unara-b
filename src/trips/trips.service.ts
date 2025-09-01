import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { TripParticipant } from './entities/trip-participant.entity';
import { User } from '../users/entities/user.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FilterTripDto } from './dto/filter-trip.dto';
import { InviteParticipantDto } from './dto/invite-participant.dto';
import { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(TripParticipant)
    private participantRepository: Repository<TripParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createTripDto: CreateTripDto, ownerId: string): Promise<Trip> {
    const owner = await this.userRepository.findOne({
      where: { id: ownerId }
    });

    if (!owner) {
      throw new NotFoundException('User not found');
    }

    const trip = this.tripRepository.create({
      ...createTripDto,
      owner,
    });

    const savedTrip = await this.tripRepository.save(trip);

    // Create owner participant record
    const ownerParticipant = this.participantRepository.create({
      trip: savedTrip,
      user: owner,
      role: 'owner',
      status: 'joined',
      invitedBy: owner,
      joinedAt: new Date(),
    });

    await this.participantRepository.save(ownerParticipant);

    return savedTrip;
  }

  async findAll(userId: string, filters?: FilterTripDto): Promise<Trip[]> {
    const query = this.tripRepository.createQueryBuilder('trip')
      .leftJoinAndSelect('trip.owner', 'owner')
      .leftJoin('trip.participants', 'participant')
      .where('(trip.owner.id = :userId OR (participant.user.id = :userId AND participant.status = :joinedStatus))', 
        { userId, joinedStatus: 'joined' });

    if (filters?.search) {
      query.andWhere('(trip.name ILIKE :search OR trip.description ILIKE :search OR trip.destination ILIKE :search)', 
        { search: `%${filters.search}%` });
    }

    if (filters?.status) {
      query.andWhere('trip.status = :status', { status: filters.status });
    }

    if (filters?.destination) {
      query.andWhere('trip.destination ILIKE :destination', 
        { destination: `%${filters.destination}%` });
    }

    if (filters?.startDateFrom) {
      query.andWhere('trip.startDate >= :startDateFrom', { startDateFrom: filters.startDateFrom });
    }

    if (filters?.startDateTo) {
      query.andWhere('trip.startDate <= :startDateTo', { startDateTo: filters.startDateTo });
    }

    if (filters?.isOwner === true) {
      query.andWhere('trip.owner.id = :userId', { userId });
    }

    if (filters?.isParticipant === true) {
      query.andWhere('participant.user.id = :userId AND participant.status = :joinedStatus', 
        { userId, joinedStatus: 'joined' });
    }

    // Pagination
    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    query.orderBy('trip.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string, userId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['owner', 'participants', 'participants.user'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Check if user has access to this trip
    const hasAccess = trip.owner.id === userId || 
      trip.participants.some(p => p.user.id === userId && p.status === 'joined');

    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return trip;
  }

  async findByShareToken(shareToken: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { shareToken, isPublic: true },
      relations: ['owner'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found or not public');
    }

    return trip;
  }

  async update(id: string, updateTripDto: UpdateTripDto, userId: string): Promise<Trip> {
    const trip = await this.findOne(id, userId);

    // Check if user can update (owner or admin)
    const canUpdate = trip.owner.id === userId || 
      trip.participants.some(p => p.user.id === userId && p.role === 'admin' && p.status === 'joined');

    if (!canUpdate) {
      throw new ForbiddenException('Only trip owner or admins can update trip details');
    }

    Object.assign(trip, updateTripDto);
    return this.tripRepository.save(trip);
  }

  async remove(id: string, userId: string): Promise<void> {
    const trip = await this.findOne(id, userId);

    // Only owner can delete
    if (trip.owner.id !== userId) {
      throw new ForbiddenException('Only trip owner can delete the trip');
    }

    await this.tripRepository.remove(trip);
  }

  async inviteParticipant(tripId: string, inviteDto: InviteParticipantDto, inviterId: string): Promise<TripParticipant> {
    const trip = await this.findOne(tripId, inviterId);

    // Check if inviter can invite (owner or admin)
    const canInvite = trip.owner.id === inviterId || 
      trip.participants.some(p => p.user.id === inviterId && p.role === 'admin' && p.status === 'joined');

    if (!canInvite) {
      throw new ForbiddenException('Only trip owner or admins can invite participants');
    }

    // Check if user exists
    const userToInvite = await this.userRepository.findOne({
      where: { id: inviteDto.userId }
    });

    if (!userToInvite) {
      throw new NotFoundException('User to invite not found');
    }

    // Check if user is already a participant
    const existingParticipant = await this.participantRepository.findOne({
      where: { trip: { id: tripId }, user: { id: inviteDto.userId } }
    });

    if (existingParticipant && existingParticipant.status !== 'left') {
      throw new BadRequestException('User is already a participant');
    }

    const inviter = await this.userRepository.findOne({
      where: { id: inviterId }
    });

    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    const participant = this.participantRepository.create({
      trip,
      user: userToInvite,
      invitedBy: inviter,
      role: inviteDto.role || 'participant',
      status: 'invited',
    });

    return this.participantRepository.save(participant);
  }

  async joinTrip(tripId: string, userId: string): Promise<TripParticipant> {
    // First, get the trip to check if it's public or if user has an invitation
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['owner', 'participants', 'participants.user'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a participant
    const existingParticipant = await this.participantRepository.findOne({
      where: { trip: { id: tripId }, user: { id: userId } },
      relations: ['trip', 'user'],
    });

    if (existingParticipant) {
      if (existingParticipant.status === 'joined') {
        throw new BadRequestException('User is already a participant');
      } else if (existingParticipant.status === 'invited') {
        // User was invited, now joining
        existingParticipant.status = 'joined';
        existingParticipant.joinedAt = new Date();
        return this.participantRepository.save(existingParticipant);
      }
    }

    // If trip is public, allow anyone to join
    if (trip.isPublic) {
      const newParticipant = this.participantRepository.create({
        trip,
        user,
        role: 'participant',
        status: 'joined',
        joinedAt: new Date(),
      });
      return this.participantRepository.save(newParticipant);
    }

    // If trip is private and no invitation found, deny access
    throw new ForbiddenException('Cannot join private trip without invitation');
  }

  async leaveTrip(tripId: string, userId: string): Promise<void> {
    // First check if user is the trip owner
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['owner'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.owner.id === userId) {
      throw new ForbiddenException('Trip owner cannot leave the trip. Transfer ownership first.');
    }

    const participant = await this.participantRepository.findOne({
      where: { trip: { id: tripId }, user: { id: userId } },
      relations: ['trip', 'user'],
    });

    if (!participant) {
      throw new NotFoundException('Participation not found');
    }

    // Check leave policy - if trip hasn't started, remove contributions
    if (trip.startDate && new Date() < trip.startDate) {
      // TODO: Remove user's luggage and items when implementing that logic
    }

    // Remove the participant completely
    await this.participantRepository.remove(participant);
  }

  async updateParticipantRole(tripId: string, participantUserId: string, updateDto: UpdateParticipantRoleDto, ownerId: string): Promise<TripParticipant> {
    const trip = await this.findOne(tripId, ownerId);

    // Only owner can update roles
    if (trip.owner.id !== ownerId) {
      throw new ForbiddenException('Only trip owner can update participant roles');
    }

    const participant = await this.participantRepository.findOne({
      where: { user: { id: participantUserId }, trip: { id: tripId } },
      relations: ['user', 'trip'],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Cannot change owner role
    if (participant.role === 'owner') {
      throw new ForbiddenException('Cannot change owner role');
    }

    participant.role = updateDto.role;
    return this.participantRepository.save(participant);
  }
}