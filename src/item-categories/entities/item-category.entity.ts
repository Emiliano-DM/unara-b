import { Item } from "../../items/entities/item.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ItemCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column('text', { unique: true })
    name: string

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column('text')
    image: string

    @OneToMany(
        () => Item,
        (item) => item.category
    )
    items: Item[]

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}