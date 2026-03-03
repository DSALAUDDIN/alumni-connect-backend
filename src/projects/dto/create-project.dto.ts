import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
    @ApiProperty({ example: 'Alumni Job Portal v2' })
    @IsString()
    @MaxLength(150)
    title: string;

    @ApiProperty({ example: 'A platform connecting alumni with job opportunities.' })
    @IsString()
    @MaxLength(2000)
    description: string;

    @ApiPropertyOptional({ example: 'https://github.com/org/project' })
    @IsOptional()
    @IsString()
    repoUrl?: string;

    @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.PLANNING })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;
}
