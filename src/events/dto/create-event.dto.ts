import { IsString, IsDateString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
    @ApiProperty({ example: 'Annual Alumni Gala 2026' })
    @IsString()
    @MaxLength(150)
    title: string;

    @ApiProperty({ example: 'Come celebrate with your alma mater!' })
    @IsString()
    @MaxLength(2000)
    description: string;

    @ApiProperty({ example: '2026-12-01T18:00:00Z' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: 'Dhaka Convention Center, Dhaka' })
    @IsString()
    @MaxLength(300)
    location: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    isOnline?: boolean;
}
