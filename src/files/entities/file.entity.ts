import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class File {
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({type:'text' })
    @Index()
    user_id: string;
    
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

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    last_update: Date;
}
