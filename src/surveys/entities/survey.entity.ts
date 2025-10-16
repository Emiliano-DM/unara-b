import { Trip } from "src/trips/entities/trip.entity"
import { User } from "src/users/entities/user.entity"
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { SurveyOption } from "./survey-option.entity"

@Entity()
export class Survey {
      @PrimaryGeneratedColumn('uuid')
      id: string

      @Column({ type: 'varchar', length: 255 })
      question: string

      @Column({ type: 'varchar', length: 50 })
      category: string  // 'Destino', 'Fechas', 'General'

      @Column({ type: 'varchar', length: 50 })
      data_type: string  // 'text', 'location', 'datetime'

      @Column({ type: 'bool', default: false })
      multiple_choice: boolean

      @Column({ type: 'bool', default: false })
      closed: boolean

      @ManyToOne(() => Trip, trip => trip.surveys, { onDelete: 'CASCADE' })
      trip: Trip

      @ManyToOne(() => User, user => user.surveys)
      user: User  // Creator

      @OneToMany(() => SurveyOption, option => option.survey, { cascade: true })
      options: SurveyOption[]

      @CreateDateColumn()
      created_at: Date
}
