import { Activity } from "src/activities/entities/activity.entity";
import { Luggage } from "src/luggage/entities/luggage.entity";
import { Place } from "src/places/entities/place.entity";
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

  @Column({ type:'text',select:false})
  password: string;

  @Column({ type:'text', array:true, default: ['user']})
  roles: string[]

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
