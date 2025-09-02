import { ItemCategory } from '../../item-categories/entities/item-category.entity';
import { LuggageItem } from '../../luggage/entities/luggage-item.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';
import { ItemStatus } from '../../common/enums/item-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @ManyToOne(() => ItemCategory, (category) => category.items, {
    nullable: false,
  })
  category: ItemCategory;

  @OneToMany(() => LuggageItem, (luggageItem) => luggageItem.item)
  luggageItems: LuggageItem[];

  @ManyToOne(() => Trip, (trip) => trip.items, { nullable: true })
  trip?: Trip;

  @ManyToOne(() => User, (user) => user.createdItems, { nullable: true })
  createdBy?: User;

  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.PLANNED,
  })
  status: ItemStatus;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  quantityUnit?: string;

  @Column({
    type: 'enum',
    enum: ['essential', 'important', 'optional'],
    default: 'important',
  })
  priority: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost?: number;

  @Column({ type: 'timestamp', nullable: true })
  purchaseBy?: Date;

  @Column({ type: 'timestamp', nullable: true })
  packBy?: Date;

  @Column({ type: 'timestamp', nullable: true })
  purchasedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  packedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
