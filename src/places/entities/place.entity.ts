import { Activity } from 'src/activities/entities/activity.entity';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Place {
    
    @PrimaryGeneratedColumn('uuid')
    id: string
    
    @Column({ type: 'varchar', length: 255 })
    name: string
    
    @Column({ type: 'text', nullable: true })
    description?: string
    
    @Column({ type: 'decimal', precision: 9, scale: 6 })
    latitude: number
    
    @Column({ type: 'decimal', precision: 9, scale: 6 })
    longitude: number
    
    @ManyToOne(
        () => Trip, 
        trip => trip.places, 
        { onDelete: 'CASCADE' }
    )
    trip: Trip;

    @OneToMany(
        () => Activity, 
        activity => activity.place
    )
    activities: Activity[];

    @ManyToOne(
        () => User,
        (user) => user.places
    )
    user: User
    
    @CreateDateColumn()
    createdAt: Date
    
    @UpdateDateColumn()
    updatedAt: Date
}
