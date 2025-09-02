import { LuggageCategory } from "../../luggage-categories/entities/luggage-category.entity";
import { Trip } from "../../trips/entities/trip.entity";
import { User } from "../../users/entities/user.entity";
import { LuggageStatus } from "../../common/enums/luggage-status.enum";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { LuggageItem } from "./luggage-item.entity";

@Entity()
export class Luggage {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column('text')
    name: string

    @ManyToOne(
        () => LuggageCategory,
        (category) => category.luggage,
        { nullable: false }
    )
    category: LuggageCategory
    
    @OneToMany(
      () => LuggageItem, 
      luggageItem => luggageItem.luggage, 
      { cascade: true }
    )
    luggageItems: LuggageItem[];

    @ManyToOne(() => Trip, trip => trip.luggage, { nullable: true })
    trip?: Trip

    @ManyToOne(() => User, user => user.luggage, { nullable: true })
    user?: User

    @ManyToOne(() => User, { nullable: true })
    assignedTo?: User

    @Column({
        type: 'enum',
        enum: LuggageStatus,
        default: LuggageStatus.EMPTY
    })
    status: LuggageStatus

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    maxWeight?: number

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    currentWeight?: number

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    maxVolume?: number

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    currentVolume?: number

    @Column({ type: 'json', nullable: true })
    dimensions?: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    color?: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    brand?: string

    @Column({ type: 'boolean', default: false })
    isCarryOn: boolean

    @Column({ type: 'boolean', default: false })
    isLocked: boolean

    @Column({ type: 'varchar', length: 200, nullable: true })
    trackingNumber?: string

    @Column({ type: 'boolean', default: false })
    hasWheels: boolean

    @Column({ type: 'boolean', default: false })
    isWaterproof: boolean

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column({ type: 'text', nullable: true })
    notes?: string
    
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
