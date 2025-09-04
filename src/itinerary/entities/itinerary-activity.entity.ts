import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { ItineraryDay } from './itinerary-day.entity';

@Entity()
export class ItineraryActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'time', nullable: true })
  startTime?: string;

  @Column({ type: 'time', nullable: true })
  endTime?: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ 
    type: 'json', 
    nullable: true,
    transformer: {
      to: (value: { lat: number; lng: number } | null) => value,
      from: (value: any) => value,
    }
  })
  coordinates?: { lat: number; lng: number };

  @ManyToOne(() => ItineraryDay, day => day.activities, { onDelete: 'CASCADE' })
  day: ItineraryDay;
}