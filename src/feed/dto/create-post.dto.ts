import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
    @ApiProperty({ example: 'Excited to be back at the annual alumni meetup!' })
    @IsString()
    @MaxLength(2000)
    content: string;

    @ApiPropertyOptional({ example: ['https://cdn.example.com/photo.jpg'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaUrls?: string[];

    @ApiPropertyOptional({ description: 'Post to a specific group' })
    @IsOptional()
    @IsString()
    groupId?: string;
}
