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
    type: 'varchar', 
    length: 50, 
    default: 'planning' 
  })
  status: string;

  @Index()
  @ManyToOne(() => User, { nullable: false, eager: true })
  owner: User;

  @Index()
  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  shareToken: string;

  @OneToMany(() => TripParticipant, participant => participant.trip, {
    cascade: true,
  })
  participants: TripParticipant[];

  @OneToMany(() => Luggage, luggage => luggage.trip)
  luggage: Luggage[];

  @OneToMany(() => Item, item => item.trip)
  items: Item[];

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