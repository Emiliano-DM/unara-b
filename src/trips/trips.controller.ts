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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FilterTripDto } from './dto/filter-trip.dto';
import { InviteParticipantDto } from './dto/invite-participant.dto';
import { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';
import { ItemsService } from '../items/items.service';
import { CreateItemDto } from '../items/dto/create-item.dto';
import { FilterItemDto } from '../items/dto/filter-item.dto';
import { LuggageService } from '../luggage/services/luggage.service';
import { CreateLuggageDto } from '../luggage/dto/create-luggage.dto';
import { FilterLuggageDto } from '../luggage/dto/filter-luggage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('trips')
@ApiBearerAuth('JWT-auth')
@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly itemsService: ItemsService,
    private readonly luggageService: LuggageService,
  ) {}

  @ApiOperation({ summary: 'Create a new trip' })
  @ApiResponse({ status: 201, description: 'Trip created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(@Body() createTripDto: CreateTripDto, @CurrentUser() user: User) {
    return this.tripsService.create(createTripDto, user.id);
  }

  @ApiOperation({ summary: 'Get all trips for the current user' })
  @ApiResponse({ status: 200, description: 'List of user trips retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findAll(@Query() filterTripDto: FilterTripDto, @CurrentUser() user: User) {
    return this.tripsService.findAll(user.id, filterTripDto);
  }

  @ApiOperation({ summary: 'Get trip by share token (public access)' })
  @ApiParam({ name: 'token', description: 'Trip share token', example: 'abc123token' })
  @ApiResponse({ status: 200, description: 'Trip retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found or not public' })
  @Get('share/:token')
  findByShareToken(@Param('token') shareToken: string) {
    return this.tripsService.findByShareToken(shareToken);
  }

  @ApiOperation({ summary: 'Get trip details by ID' })
  @ApiParam({ name: 'id', description: 'Trip UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Trip details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found or access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tripsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripDto: UpdateTripDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.update(id, updateTripDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tripsService.remove(id, user.id);
  }

  @Post(':id/invite')
  inviteParticipant(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() inviteParticipantDto: InviteParticipantDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.inviteParticipant(tripId, inviteParticipantDto, user.id);
  }

  @Post(':id/join')
  joinTrip(@Param('id', ParseUUIDPipe) tripId: string, @CurrentUser() user: User) {
    return this.tripsService.joinTrip(tripId, user.id);
  }

  @Delete(':id/leave')
  leaveTrip(@Param('id', ParseUUIDPipe) tripId: string, @CurrentUser() user: User) {
    return this.tripsService.leaveTrip(tripId, user.id);
  }

  @Patch(':id/participants/:userId/role')
  updateParticipantRole(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('userId', ParseUUIDPipe) participantUserId: string,
    @Body() updateParticipantRoleDto: UpdateParticipantRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.updateParticipantRole(
      tripId,
      participantUserId,
      updateParticipantRoleDto,
      user.id,
    );
  }

  @Post(':id/items')
  createTripItem(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() createItemDto: CreateItemDto,
    @CurrentUser() user: User,
  ) {
    return this.itemsService.createForTrip(tripId, createItemDto, user.id);
  }

  @Get(':id/items')
  findTripItems(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: User,
    @Query() filterItemDto?: FilterItemDto,
  ) {
    return this.itemsService.findByTrip(tripId, user.id, filterItemDto);
  }

  @Post(':id/luggage')
  createTripLuggage(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() createLuggageDto: CreateLuggageDto,
    @CurrentUser() user: User,
  ) {
    return this.luggageService.createForTrip(tripId, createLuggageDto, user.id);
  }

  @Get(':id/luggage')
  findTripLuggage(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: User,
    @Query() filterLuggageDto?: FilterLuggageDto,
  ) {
    return this.luggageService.findByTrip(tripId, user.id, filterLuggageDto);
  }
}