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

@Entity()
@Unique(['trip', 'user'])
export class TripParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Trip, trip => trip.participants, { 
    onDelete: 'CASCADE' 
  })
  trip: Trip;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'participant' 
  })
  role: string; // owner, admin, participant

  @Index()
  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'invited' 
  })
  status: string; // invited, joined, left

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