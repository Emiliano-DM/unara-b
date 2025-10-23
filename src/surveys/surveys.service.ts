import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Survey, SurveyOption, SurveyVote } from './entities';
import { DataSource, Repository } from 'typeorm';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import { Activity } from 'src/activities/entities/activity.entity';
import { EventsGateway } from 'src/events/events.gateway';


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

    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,

    private readonly eventsGateway: EventsGateway,
    private readonly dataSource: DataSource,
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

    // Emit WebSocket event
    this.eventsGateway.emitSurveyCreated(tripId, userId, {
      surveyId: survey.id,
      question: survey.question,
      category: survey.category,
    });

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
    const survey = await this.surveyRepository.findOne({
      where: {id:surveyId},
      relations: {trip: true}
    })
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

    const option = await this.optionRepository.findOneBy({id:optionId})
    if (!option){
      throw new NotFoundException('Option not found')
    }

    const existingVote = await this.voteRepository.findOne({
      where : {survey:{id:surveyId}, user: {id:userId}},
      relations: ['option']
    })

    let vote;

    if (existingVote){
      // User is changing their vote
      const oldOption = existingVote.option;

      // Only update if voting for a different option
      if (oldOption.id !== optionId) {
        // Decrement old option's vote count
        oldOption.votes -= 1;
        await this.optionRepository.save(oldOption);

        // Update vote record to point to new option
        existingVote.option = option;

        // Increment new option's vote count
        option.votes += 1;
        await this.optionRepository.save(option);

        vote = await this.voteRepository.save(existingVote);
      } else {
        // User clicked same option - no change needed
        vote = existingVote;
      }
    } else {
      // New vote - first time voting
      vote = this.voteRepository.create({survey, option, user})
      option.votes += 1
      await this.optionRepository.save(option)
      await this.voteRepository.save(vote)
    }

    // Check if survey should auto-close (all participants have voted)
    // Get unique voters count
    const uniqueVoters = await this.voteRepository
      .createQueryBuilder('vote')
      .where('vote.surveyId = :surveyId', { surveyId })
      .select('COUNT(DISTINCT vote.userId)', 'count')
      .getRawOne();

    // Get total trip participants
    const tripWithUsers = await this.tripRepository.findOne({
      where: { id: survey.trip.id },
      relations: ['users']
    });

    const totalParticipants = tripWithUsers?.users?.length || 0;

    // If all participants have voted, auto-close the survey
    if (parseInt(uniqueVoters.count) >= totalParticipants && totalParticipants > 0) {
      console.log('🔒 All participants voted - auto-closing survey');

      // Close survey and process winner
      await this.closeSurvey(surveyId, userId);

      return vote;
    }

    // Emit WebSocket event
    this.eventsGateway.emitSurveyVoted(survey.trip.id, userId, {
      surveyId: survey.id,
      optionId: option.id,
      votes: option.votes,
    });

    return vote

  }

  async closeSurvey(surveyId:string, userId:string){
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const survey = await queryRunner.manager.findOne(Survey, {
        where: {id:surveyId},
        relations: {options:true, trip:true}
      })
      if (!survey){
        throw new NotFoundException('survey not found')
      }
      if (survey.closed){
        throw new BadRequestException('survey already closed')
      }

      const winnerOption = await this.calculateWinner(survey, queryRunner);

      const tripChanges: any = {};

      if (survey.category === 'Destination'){
        survey.trip.destination_latitude = winnerOption.latitude;
        survey.trip.destination_longitude = winnerOption.longitude;
        survey.trip.destination = winnerOption.text;
        await queryRunner.manager.save(survey.trip);

        tripChanges.destination = winnerOption.text;
        tripChanges.destination_latitude = winnerOption.latitude;
        tripChanges.destination_longitude = winnerOption.longitude;
      }else if (survey.category === 'Dates'){
        if (!winnerOption.datetime || !winnerOption.endDatetime) {
          throw new BadRequestException('Date range required for Dates survey')
        }
        survey.trip.startDate = winnerOption.datetime;
        survey.trip.endDate = winnerOption.endDatetime;
        await queryRunner.manager.save(survey.trip);

        tripChanges.startDate = winnerOption.datetime;
        tripChanges.endDate = winnerOption.endDatetime;
      } else if (survey.category === 'General') {
        // Add winning option to itinerary
        const user = await queryRunner.manager.findOneBy(User, {id: userId});

        if (winnerOption.latitude && winnerOption.longitude) {
          // Location-based survey - create activity with location
          const activity = queryRunner.manager.create(Activity, {
            name: winnerOption.text,
            description: `Added from survey: ${survey.question}`,
            date: survey.trip.startDate || new Date(),
            trip: survey.trip,
            ...(user && { user }), // Only add user if it exists
          });
          await queryRunner.manager.save(activity);

          console.log('✅ Added location-based activity to itinerary');
        } else if (winnerOption.datetime) {
          // DateTime-based survey - create activity with specific date/time
          const activity = queryRunner.manager.create(Activity, {
            name: winnerOption.text,
            description: `Added from survey: ${survey.question}`,
            date: winnerOption.datetime,
            trip: survey.trip,
            ...(user && { user }), // Only add user if it exists
          });
          await queryRunner.manager.save(activity);

          console.log('✅ Added datetime-based activity to itinerary');
        } else {
          // Text survey - just close, no itinerary addition
          console.log('ℹ️ Text survey closed, no itinerary update');
        }
      }

      await queryRunner.commitTransaction();

      // Emit WebSocket events AFTER successful commit
      this.eventsGateway.emitSurveyClosed(survey.trip.id, userId, {
        surveyId: survey.id,
        question: survey.question,
        category: survey.category,
        closed: true,
        winningOption: {
          id: winnerOption.id,
          text: winnerOption.text,
          latitude: winnerOption.latitude,
          longitude: winnerOption.longitude,
          datetime: winnerOption.datetime,
          endDatetime: winnerOption.endDatetime,
        },
      });

      if (Object.keys(tripChanges).length > 0) {
        this.eventsGateway.emitTripUpdated(survey.trip.id, userId, {
          tripId: survey.trip.id,
          changes: tripChanges,
          reason: 'survey_result',
          surveyId: survey.id,
        });
      }

      return winnerOption;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async calculateWinner(survey:Survey, queryRunner: any){
    if (survey.options.length === 0){
      throw new BadRequestException('Survey has no options')
    }
    const maxOptionVotes = Math.max(...survey.options.map(opt=> opt.votes))
    const mostVotedOptions = survey.options.filter(opt => opt.votes === maxOptionVotes)
    const winner = mostVotedOptions[Math.floor(Math.random()*mostVotedOptions.length)]
    survey.closed = true
    await queryRunner.manager.save(survey)

    return winner
  }

}
