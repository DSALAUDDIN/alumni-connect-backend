import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMentorshipDto {
    @ApiProperty({ description: 'ID of the mentor user' })
    @IsString()
    mentorId: string;

    @ApiPropertyOptional({ example: 'Career growth in software engineering' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    topic?: string;

    @ApiPropertyOptional({ example: 'Looking for guidance on system design skills.' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}
