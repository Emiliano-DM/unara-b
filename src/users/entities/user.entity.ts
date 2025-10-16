import { Activity } from "src/activities/entities/activity.entity";
import { Luggage } from "src/luggage/entities/luggage.entity";
import { Place } from "src/places/entities/place.entity";
import { Survey } from "src/surveys/entities/survey.entity";
import { Trip } from "src/trips/entities/trip.entity";
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  fullname: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255, unique: true })
  username: string;

  @Column({ type:'text',select:false, nullable:true})
  password: string;

  @Column({ type:'text', array:true, default: ['user']})
  roles: string[]

  @Column({type:'text', nullable: true, select: false })
  refresh_token?: string

  @Column({type:'text', nullable:true,select:false})
  password_reset_token?: string | null

  @Column({type:'timestamp', nullable:true, select:false})
  password_reset_expires?: Date | null

  @Column({type:'bool', default:false})
  isEmailVerified: boolean

  @Column({type:'text', nullable:true,select:false})
  emailVerificationToken?: string | null
  
  @Column({type:'timestamp', nullable:true, select:false})
  emailVerificationExpires?: Date | null

  @Column({type:'bool', default:true})
  isActive: boolean

  @Column({ type: "text", nullable: true })
  profile_picture?: string;

  @OneToMany(() => Luggage, (luggage) => luggage.user)
  luggage: Luggage[];

  @ManyToMany(() => Trip, (trip) => trip.users)
  trips: Trip[];

  @OneToMany(() => Activity, (activity) => activity.user, { cascade: true })
  activities: Activity[];

  @OneToMany(() => Place, (place) => place.user, { cascade: true })
  places: Place[];

  @OneToMany(() => Survey, survey => survey.user)
  surveys: Survey[]


  @BeforeInsert()
  checkFieldsBeforeInsert(){
      this.email = this.email.toLowerCase().trim()
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate(){
      this.checkFieldsBeforeInsert()
  }
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}
