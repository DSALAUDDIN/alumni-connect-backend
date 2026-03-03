import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({ example: 'Hey! Great to connect!' })
    @IsString()
    @MaxLength(2000)
    content: string;

    @ApiPropertyOptional({ description: 'Receiver user ID (for direct messages)' })
    @IsOptional()
    @IsString()
    receiverId?: string;

    @ApiPropertyOptional({ description: 'Chat room ID (for group chats)' })
    @IsOptional()
    @IsString()
    chatRoomId?: string;
}
