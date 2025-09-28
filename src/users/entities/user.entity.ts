import { Activity } from "src/activities/entities/activity.entity";
import { Luggage } from "src/luggage/entities/luggage.entity";
import { Place } from "src/places/entities/place.entity";
import { Trip } from "src/trips/entities/trip.entity";
import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

    @ManyToMany(
        () => Luggage,
        (luggage) => luggage.users
    )
    luggage: Luggage[]

    @ManyToMany(
        () => Trip,
        (trip) => trip.users
    )
    trips: Trip[]

    @OneToMany(
        () => Activity,
        (activity) => activity.user, 
        { cascade: true }
    )
    activities: Activity[]

    @OneToMany(
        () => Place,
        (place) => place.user, 
        { cascade: true }
    )
    places: Place[]

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
