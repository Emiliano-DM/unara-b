import { Controller, Post, Body, Param } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { VoteDto } from './dto/vote.dto';
import { GetUser } from 'src/auth/decoradors/get-user.decorador';
import { User } from 'src/users/entities/user.entity';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Auth } from 'src/auth/decoradors/auth.decorador';

@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post(':id/vote')
  @Auth(ValidRoles.user)
  vote(@Param('id') id:string , @GetUser() user:User ,@Body() voteDto: VoteDto ) {
    return this.surveysService.vote(id, user.id, voteDto.optionId);
  }

  @Post(':id/close')
  @Auth(ValidRoles.user)
  closeSurvey(@Param('id') id:string, @GetUser() user:User){
    return this.surveysService.closeSurvey(id, user.id)
  }


}
