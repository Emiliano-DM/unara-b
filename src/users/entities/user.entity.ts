import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Luggage } from "../../luggage/entities/luggage.entity";
import { Item } from "../../items/entities/item.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 255 })
    fullname: string

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string
    
    @Column({ type: 'varchar', length: 255, unique: true })
    username: string

    @Column('text')
    password: string

    @Column({ type: 'text', nullable: true })
    profile_picture?: string

    @OneToMany(() => Luggage, luggage => luggage.user)
    luggage: Luggage[];

    @OneToMany(() => Item, item => item.createdBy)
    createdItems: Item[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
