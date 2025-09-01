import { LuggageCategory } from "src/luggage-categories/entities/luggage-category.entity";
import { Trip } from "src/trips/entities/trip.entity";
import { User } from "src/users/entities/user.entity";
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
    
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
