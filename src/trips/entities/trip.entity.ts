import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TripParticipant } from './trip-participant.entity';
import { Luggage } from '../../luggage/entities/luggage.entity';
import { Item } from '../../items/entities/item.entity';
import { TripStatus } from '../../common/enums/trip-status.enum';
import { Itinerary } from '../../itinerary/entities/itinerary.entity';
import { randomBytes } from 'crypto';

@Entity()
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  destination?: string;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Index()
  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.PLANNING,
  })
  status: TripStatus;

  @Index()
  @ManyToOne(() => User, { nullable: false, eager: true })
  owner: User;

  @Index()
  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  shareToken: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget?: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'int', nullable: true })
  maxParticipants?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  departureLocation?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timeZone?: string;

  @Column({ type: 'json', nullable: true })
  coordinates?: string;

  @Column({ type: 'text', nullable: true })
  accommodation?: string;

  @Column({ type: 'text', nullable: true })
  transportation?: string;

  @Column({ type: 'date', nullable: true })
  bookingDeadline?: Date;

  @Column({ type: 'text', nullable: true })
  requirements?: string;

  @OneToMany(() => TripParticipant, (participant) => participant.trip, {
    cascade: true,
  })
  participants: TripParticipant[];

  @OneToMany(() => Luggage, (luggage) => luggage.trip)
  luggage: Luggage[];

  @OneToMany(() => Item, (item) => item.trip)
  items: Item[];

  @OneToMany(() => Itinerary, (itinerary) => itinerary.trip)
  itinerary: Itinerary[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateShareToken() {
    if (!this.shareToken) {
      this.shareToken = randomBytes(16).toString('hex');
    }
  }
}
