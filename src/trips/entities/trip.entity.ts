import { Place } from "src/places/entities/place.entity";
import { Luggage } from "src/luggage/entities/luggage.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Activity } from "src/activities/entities/activity.entity";
import { User } from "src/users/entities/user.entity";
import { Survey } from "src/surveys/entities/survey.entity";

@Entity()
export class Trip {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 255 })
    name: string

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column({ type: 'text' })
    destination: string

    @Column({type:'decimal', precision:9, scale:6, nullable:true})
    destination_latitude?:number

    @Column({type:'decimal', precision:9, scale:6, nullable:true})
    destination_longitude?:number

    @Column({ type: 'timestamptz' })
    startDate: Date;

    @Column({ type: 'timestamptz' })
    endDate: Date;

    @Column({type:'text', nullable:true})
    trip_photo?: string
    
    @OneToMany(
        () => Place, 
        place => place.trip, 
        { cascade: true }
    )
    places: Place[];

    @OneToMany(
      () => Luggage, 
      luggage => luggage.trip
    )
    luggage: Luggage[];

    @JoinTable()
    @ManyToMany(
        () => User,
        (user) => user.trips
    )
    users: User[]

    @OneToMany(
        () => Activity, 
        activity => activity.trip
    )
    activities: Activity[]

    @OneToMany(() => Survey, survey => survey.trip)
    surveys: Survey[]

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
