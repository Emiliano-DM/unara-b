import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Itinerary } from './itinerary.entity';
import { ItineraryActivity } from './itinerary-activity.entity';

@Entity()
export class ItineraryDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int' })
  dayNumber: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ManyToOne(() => Itinerary, itinerary => itinerary.days, { onDelete: 'CASCADE' })
  itinerary: Itinerary;

  @OneToMany(() => ItineraryActivity, activity => activity.day, { cascade: true })
  activities: ItineraryActivity[];
}