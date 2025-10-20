import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TripEventPayload, TripEventType } from './interfaces/trip-events.interface';
import { JoinTripRoomDto, LeaveTripRoomDto } from './dto/trip-event.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins in development
    credentials: true,
  },
  transports: ['polling', 'websocket'], // Support both for React Native
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);

      // Store user data in socket
      client.data.userId = payload.sub;
      client.data.email = payload.email;

      this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:trip')
  handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinTripRoomDto,
  ) {
    const roomName = `trip:${dto.tripId}`;
    client.join(roomName);

    this.logger.log(`User ${client.data.userId} joined room ${roomName}`);

    // Notify other members
    client.to(roomName).emit('member:joined', {
      userId: client.data.userId,
      tripId: dto.tripId,
      timestamp: new Date(),
    });

    return { success: true, room: roomName };
  }

  @SubscribeMessage('leave:trip')
  handleLeaveTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: LeaveTripRoomDto,
  ) {
    const roomName = `trip:${dto.tripId}`;
    client.leave(roomName);

    this.logger.log(`User ${client.data.userId} left room ${roomName}`);

    // Notify other members
    client.to(roomName).emit('member:left', {
      userId: client.data.userId,
      tripId: dto.tripId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  /**
   * Broadcast event to all members in a trip room
   */
  emitToTrip<T>(tripId: string, event: TripEventPayload<T>) {
    const roomName = `trip:${tripId}`;
    this.server.to(roomName).emit(event.type, event);
    this.logger.debug(`Event ${event.type} emitted to room ${roomName}`);
  }

  /**
   * Emit survey events
   */
  emitSurveyCreated(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.SURVEY_CREATED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  emitSurveyVoted(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.SURVEY_VOTED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  emitSurveyClosed(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.SURVEY_CLOSED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Emit place events
   */
  emitPlaceAdded(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.PLACE_ADDED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  emitPlaceUpdated(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.PLACE_UPDATED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  emitPlaceRemoved(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.PLACE_REMOVED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Emit activity events
   */
  emitActivityAdded(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.ACTIVITY_ADDED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  emitActivityUpdated(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.ACTIVITY_UPDATED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  emitActivityRemoved(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.ACTIVITY_REMOVED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Emit trip update events
   */
  emitTripUpdated(tripId: string, userId: string, data: any) {
    this.emitToTrip(tripId, {
      type: TripEventType.TRIP_UPDATED,
      tripId,
      userId,
      timestamp: new Date(),
      data,
    });
  }
}
