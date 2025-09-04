import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { ItineraryDay } from './itinerary-day.entity';

@Entity()
export class Itinerary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, trip => trip.itinerary, { onDelete: 'CASCADE' })
  trip: Trip;

  @OneToMany(() => ItineraryDay, day => day.itinerary, { cascade: true })
  days: ItineraryDay[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}