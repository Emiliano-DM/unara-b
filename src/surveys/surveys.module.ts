import { Module } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Survey, SurveyOption, SurveyVote } from './entities';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import { Place } from 'src/places/entities/place.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    controllers: [SurveysController],
    providers: [SurveysService],
    imports: [
      TypeOrmModule.forFeature([
        Survey,
        SurveyOption,
        SurveyVote,
        Trip,
        User,
        Place
      ]),
      AuthModule
    ],
    exports: [SurveysService]
  })
export class SurveysModule {}
