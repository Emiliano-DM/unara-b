  import { IsUUID } from 'class-validator';

  export class VoteDto {
      @IsUUID()
      optionId: string;
  }