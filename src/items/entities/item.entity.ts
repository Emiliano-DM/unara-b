import { ItemCategory } from "src/item-categories/entities/item-category.entity";
import { LuggageItem } from "src/luggage/entities/luggage-item.entity";
import { Trip } from "src/trips/entities/trip.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Item {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 255 })
    name: string

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column({ type: 'text', nullable: true })
    image?: string

    @ManyToOne(
        () => ItemCategory,
        (category) => category.items,
        { nullable: false }
    )
    category: ItemCategory
    
    @OneToMany(
        () => LuggageItem,
        luggageItem => luggageItem.item
    )
    luggageItems: LuggageItem[];

    @ManyToOne(() => Trip, trip => trip.items, { nullable: true })
    trip?: Trip

    @ManyToOne(() => User, user => user.createdItems, { nullable: true })
    createdBy?: User

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
