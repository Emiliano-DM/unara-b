import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Survey } from "./survey.entity";
import { SurveyOption } from "./survey-option.entity";
import { User } from "src/users/entities/user.entity";

@Entity()
export class SurveyVote {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
    survey: Survey

    @ManyToOne(() => SurveyOption, (option) => option.surveyVotes, { onDelete: 'CASCADE' })
    option: SurveyOption

    @ManyToOne(() => User)
    user: User

    @CreateDateColumn()
    voted_at: Date
}