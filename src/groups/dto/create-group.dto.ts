import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupDto {
    @ApiProperty({ example: 'CSE Batch 2019' })
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ example: 'Group for CSE 2019 alumni' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;
}
