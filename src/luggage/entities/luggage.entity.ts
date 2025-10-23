import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { LuggageItem } from "./luggage-item.entity";
import { Trip } from "src/trips/entities/trip.entity";
import { User } from "src/users/entities/user.entity";

@Entity()
export class Luggage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  name: string;

  @Column("boolean", { default: false })
  is_shared: boolean;

  @Column("simple-array", { nullable: true })
  notes: string[];

  @OneToMany(
    () => LuggageItem,
    (luggageItem) => luggageItem.luggage,
    { cascade: true }
  )
  luggageItems: LuggageItem[];

  @ManyToOne(
    () => Trip,
    (trip) => trip.luggage,
    { nullable: true, onDelete: "SET NULL" }
  )
  trip?: Trip;

  @ManyToOne(
    () => User,
    (user) => user.luggage,
    { nullable: false, onDelete: "CASCADE" }
  )
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
