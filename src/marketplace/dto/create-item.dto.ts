import { IsString, IsNumber, IsOptional, IsArray, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemStatus } from '@prisma/client';

export class CreateMarketplaceItemDto {
    @ApiProperty({ example: 'MacBook Pro 2020' })
    @IsString()
    @MaxLength(150)
    title: string;

    @ApiProperty({ example: 'Barely used. Great condition.' })
    @IsString()
    @MaxLength(2000)
    description: string;

    @ApiProperty({ example: 850.00 })
    @IsNumber()
    price: number;

    @ApiPropertyOptional({ example: ['https://cdn.example.com/img.jpg'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaUrls?: string[];
}
