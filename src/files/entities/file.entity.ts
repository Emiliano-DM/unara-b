import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class File {
    @PrimaryGeneratedColumn('uuid')
    id:string;
    
    @Column({type:'text'})
    @Index()
    entity_type: string;

    @Column({type:'text'})
    @Index()
    entity_id: string;

    @Column({type:'text'})
    cloudinary_public_id: string;

    @Column({type:'text'})
    url: string;

    @Column({type:'numeric'})
    file_size: number;

    @Column({type:'text'})
    mime_type: string;

    @ManyToOne(
        ()=> User,
        {cascade:true}
    )
    @JoinColumn(
        { name: 'user_id' }
    )
    user: User
    

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    last_update: Date;
}
