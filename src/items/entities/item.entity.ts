import { ItemCategory } from "src/item-categories/entities/item-category.entity";
import { LuggageItem } from "src/luggage/entities/luggage-item.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Item {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 255, unique: true })
    name: string

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column({ type: 'text', nullable: true, unique: true })
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

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
