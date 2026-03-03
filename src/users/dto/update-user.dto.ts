import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'Jane' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({ example: 'Building cool things!' })
    @IsOptional()
    @IsString()
    @MaxLength(160)
    motto?: string;

    @ApiPropertyOptional({ example: 2021 })
    @IsOptional()
    graduationYear?: number;

    @ApiPropertyOptional({ example: 'Software Engineering' })
    @IsOptional()
    @IsString()
    degree?: string;
}
