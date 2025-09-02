import { Luggage } from "../../luggage/entities/luggage.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class LuggageCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column('text', { unique: true })
    name: string

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column('text')
    image: string

    @OneToMany(
        () => Luggage,
        (luggage) => luggage.category
    )
    luggage: Luggage[]

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}