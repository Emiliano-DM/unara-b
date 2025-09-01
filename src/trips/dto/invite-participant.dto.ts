import { IsString, IsNotEmpty, IsUUID, IsOptional, IsIn } from 'class-validator';

export class InviteParticipantDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsOptional()
    @IsString()
    @IsIn(['admin', 'participant'])
    role?: string = 'participant';
}