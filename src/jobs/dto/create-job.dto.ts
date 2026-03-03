import { IsString, IsEnum, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType } from '@prisma/client';

export class CreateJobDto {
    @ApiProperty({ example: 'Senior Software Engineer' })
    @IsString()
    @MaxLength(150)
    title: string;

    @ApiProperty({ example: 'Grameenphone Ltd.' })
    @IsString()
    @MaxLength(150)
    company: string;

    @ApiProperty({ example: 'Looking for a talented engineer...' })
    @IsString()
    @MaxLength(3000)
    description: string;

    @ApiProperty({ example: 'Dhaka, Bangladesh' })
    @IsString()
    @MaxLength(200)
    location: string;

    @ApiPropertyOptional({ example: 'BDT 1,20,000/month' })
    @IsOptional()
    @IsString()
    salary?: string;

    @ApiProperty({ enum: JobType, example: JobType.FULL_TIME })
    @IsEnum(JobType)
    type: JobType;

    @ApiPropertyOptional({ example: '2026-06-30T00:00:00Z' })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}
