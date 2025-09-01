import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateParticipantRoleDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['admin', 'participant'])
    role: string;
}