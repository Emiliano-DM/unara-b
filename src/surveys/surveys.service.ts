import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Survey, SurveyOption, SurveyVote } from './entities';
import { Repository } from 'typeorm';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';


@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    
    @InjectRepository(SurveyOption)
    private readonly optionRepository: Repository<SurveyOption>,
    
    @InjectRepository(SurveyVote)
    private readonly voteRepository: Repository<SurveyVote>,
    
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  async create(tripId: string, userId: string, createSurveyDto: CreateSurveyDto) {
    const trip = await this.tripRepository.findOne({
      where: {id:tripId}, 
      relations: {users:true}
    })
    if (!trip){
      throw new NotFoundException('Trip not found')
    }
    if (!trip.users.some(u=> u.id === userId)){
      throw new UnauthorizedException('Not a trip participant')
    }
    const user = await this.userRepository.findOneBy({id:userId})
    if(!user){
      throw new UnauthorizedException('Invalid user')
    }

    const survey = this.surveyRepository.create({
        ...createSurveyDto,
        trip,
        user,
        options : createSurveyDto.options.map(opt => this.optionRepository.create(opt))
    })

    await this.surveyRepository.save(survey)
    return survey
  }

  async findAll(tripId:string) {
    return await this.surveyRepository.find({
      where: { trip: { id: tripId } },
      relations: { options: true, user: true },
      order: { created_at: 'DESC' }
    });;
  }

  findOne(id: number) {
    return `This action returns a #${id} survey`;
  }

  update(id: number, updateSurveyDto: UpdateSurveyDto) {
    return `This action updates a #${id} survey`;
  }

  remove(id: number) {
    return `This action removes a #${id} survey`;
  }

  async vote(surveyId:string, userId:string, optionId:string){
    const survey = await this.surveyRepository.findOneBy({id:surveyId})
    if (!survey){
      throw new NotFoundException('survey not found')
    }
    if (survey.closed){
      throw new BadRequestException('survey already closed')
    }

    const user = await this.userRepository.findOneBy({id: userId})
    if (!user){
      throw new UnauthorizedException('Invalid user')
    }

    const existingVote = await this.voteRepository.findOne({
      where : {survey:{id:surveyId}, user: {id:userId}}
    })
    if (existingVote){
      throw new BadRequestException('Already voted')
    }
    
    const option = await this.optionRepository.findOneBy({id:optionId})
    if (!option){
      throw new NotFoundException('Option not found')
    }
    const vote = this.voteRepository.create({survey, option, user})
    option.votes += 1
    await this.optionRepository.save(option)
    await this.voteRepository.save(vote)
    return vote

  }

  async closeSurvey(surveyId:string){
    const survey = await this.surveyRepository.findOne({
      where: {id:surveyId}, 
      relations: {options:true, trip:true}
    })
    if (!survey){
      throw new NotFoundException('survey not found')
    }
    if (survey.closed){
      throw new BadRequestException('survey already closed')
    }
    const winnerOption = await this.calculateWinner(survey)
    if (survey.category === 'Destination'){
      survey.trip.destination_latitude = winnerOption.latitude
      survey.trip.destination_longitude = winnerOption.longitude
      survey.trip.destination = winnerOption.text
      await this.tripRepository.save(survey.trip)
    }else if (survey.category === 'Dates'){
      if (!winnerOption.datetime || !winnerOption.endDatetime) {
        throw new BadRequestException('Date range required for Dates survey')
      }
      survey.trip.startDate = winnerOption.datetime
      survey.trip.endDate = winnerOption.endDatetime
      await this.tripRepository.save(survey.trip)
    }
    return winnerOption
  }

  private async calculateWinner(survey:Survey){
    if (survey.options.length === 0){
      throw new BadRequestException('Survey has no options')
    }
    const maxOptionVotes = Math.max(...survey.options.map(opt=> opt.votes))
    const mostVotedOptions = survey.options.filter(opt => opt.votes === maxOptionVotes)
    const winner = mostVotedOptions[Math.floor(Math.random()*mostVotedOptions.length)]
    survey.closed = true
    await this.surveyRepository.save(survey)
    
    return winner
  }

}
