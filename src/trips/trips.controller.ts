import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FilterTripDto } from './dto/filter-trip.dto';
import { InviteParticipantDto } from './dto/invite-participant.dto';
import { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@Body() createTripDto: CreateTripDto) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.create(createTripDto, mockUserId);
  }

  @Get()
  findAll(@Query() filterTripDto: FilterTripDto) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.findAll(mockUserId, filterTripDto);
  }

  @Get('share/:token')
  findByShareToken(@Param('token') shareToken: string) {
    return this.tripsService.findByShareToken(shareToken);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.findOne(id, mockUserId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.update(id, updateTripDto, mockUserId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.remove(id, mockUserId);
  }

  @Post(':id/invite')
  inviteParticipant(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() inviteParticipantDto: InviteParticipantDto,
  ) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.inviteParticipant(tripId, inviteParticipantDto, mockUserId);
  }

  @Post(':id/join')
  joinTrip(@Param('id', ParseUUIDPipe) tripId: string) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.joinTrip(tripId, mockUserId);
  }

  @Delete(':id/leave')
  leaveTrip(@Param('id', ParseUUIDPipe) tripId: string) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.leaveTrip(tripId, mockUserId);
  }

  @Patch(':id/participants/:userId/role')
  updateParticipantRole(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('userId', ParseUUIDPipe) participantUserId: string,
    @Body() updateParticipantRoleDto: UpdateParticipantRoleDto,
  ) {
    // TODO: Get user ID from authentication guard
    const mockUserId = 'user-uuid-from-auth';
    return this.tripsService.updateParticipantRole(
      tripId,
      participantUserId,
      updateParticipantRoleDto,
      mockUserId,
    );
  }
}