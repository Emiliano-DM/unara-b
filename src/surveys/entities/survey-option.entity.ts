import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Survey } from "./survey.entity";
import { Place } from "src/places/entities/place.entity";
import { SurveyVote } from "./survey-vote.entity";

@Entity()
export class SurveyOption {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'text' })
    text: string

    @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
    latitude?: number

    @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
    longitude?: number

    @ManyToOne(() => Place, { nullable: true })
    place?: Place  

    @Column({ type: 'int', default: 0 })
    votes: number  

    @Column({ type: 'timestamp', nullable: true })
    datetime?: Date  

    @Column({ type: 'timestamp', nullable: true })
    endDatetime?: Date  

    @ManyToOne(() => Survey, survey => survey.options, { onDelete: 'CASCADE' })
    survey: Survey

    @OneToMany(() => SurveyVote, vote => vote.option)
    surveyVotes: SurveyVote[]
}