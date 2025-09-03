import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Trip } from './trip.entity';
import { ParticipantRole } from '../../common/enums/participant-role.enum';
import { ParticipantStatus } from '../../common/enums/participant-status.enum';

@Entity()
@Unique(['trip', 'user'])
export class TripParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Trip, (trip) => trip.participants, {
    onDelete: 'CASCADE',
  })
  trip: Trip;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.PARTICIPANT,
  })
  role: ParticipantRole;

  @Index()
  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.INVITED,
  })
  status: ParticipantStatus;

  @ManyToOne(() => User, { nullable: false })
  invitedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
