import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Luggage } from "../../luggage/entities/luggage.entity";
import { Item } from "../../items/entities/item.entity";

@Entity()
export class User {
    @ApiProperty({ description: 'User unique identifier', format: 'uuid' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Full name of the user', example: 'John Doe', required: false })
    @Column({ type: 'varchar', length: 255, nullable: true })
    fullname?: string

    @ApiProperty({ description: 'First name', example: 'John', required: false })
    @Column({ type: 'varchar', length: 255, nullable: true })
    firstName?: string

    @ApiProperty({ description: 'Last name', example: 'Doe', required: false })
    @Column({ type: 'varchar', length: 255, nullable: true })
    lastName?: string

    @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
    @Column({ type: 'varchar', length: 255, unique: true })
    email: string

    @ApiProperty({ description: 'Email verification status', example: false })
    @Column({ type: 'boolean', default: false })
    emailVerified: boolean
    
    @ApiProperty({ description: 'Username', example: 'johndoe123' })
    @Column({ type: 'varchar', length: 50, unique: true })
    username: string

    @Exclude()
    @Column('text')
    password: string

    @Exclude()
    @Column({ type: 'varchar', length: 255, nullable: true })
    passwordResetToken?: string

    @Exclude()
    @Column({ type: 'timestamp', nullable: true })
    passwordResetExpiresAt?: Date

    @ApiProperty({ description: 'Account active status', example: true })
    @Column({ type: 'boolean', default: true })
    isActive: boolean

    @ApiProperty({ description: 'Last login timestamp', required: false })
    @Column({ type: 'timestamp', nullable: true })
    lastLoginAt?: Date

    @Column({ type: 'text', nullable: true })
    profile_picture?: string

    @Column({ type: 'varchar', length: 20, nullable: true })
    phoneNumber?: string

    @Column({ type: 'date', nullable: true })
    dateOfBirth?: Date

    @Column({ type: 'varchar', length: 100, nullable: true })
    country?: string

    @Column({ type: 'varchar', length: 50, nullable: true })
    timezone?: string

    @Column({ type: 'varchar', length: 10, default: 'en' })
    language: string

    @Column({ type: 'json', nullable: true })
    travelPreferences?: string

    @Column({ type: 'text', nullable: true })
    emergencyContact?: string

    @OneToMany(() => Luggage, luggage => luggage.user)
    luggage: Luggage[];

    @OneToMany(() => Item, item => item.createdBy)
    createdItems: Item[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
