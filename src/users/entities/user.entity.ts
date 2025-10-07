import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

    @Column('text', {
        select:false
    })
    password: string

    @Column({ type: 'text', nullable: true })
    profile_picture?: string

    @Column({ type:'text', array:true, default: ['user']})
    roles: string[]

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    checkFieldsBeforeInsert(){
        this.email = this.email.toLowerCase().trim()
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate(){
        this.checkFieldsBeforeInsert()
    }
}
