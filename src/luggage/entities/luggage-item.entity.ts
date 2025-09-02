import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Luggage } from './luggage.entity';
import { Item } from '../../items/entities/item.entity';

@Entity()
export class LuggageItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Luggage, (luggage) => luggage.luggageItems, {
    onDelete: 'CASCADE',
  })
  luggage: Luggage;

  @ManyToOne(() => Item, (item) => item.luggageItems, { onDelete: 'CASCADE' })
  item: Item;

  @Column({ default: 1 })
  quantity: number;
}
