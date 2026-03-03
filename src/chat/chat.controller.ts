import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('send')
    @ApiOperation({ summary: 'Send a message (REST fallback; Socket.io for real-time)' })
    send(@Body() dto: SendMessageDto, @CurrentUser('id') userId: string) {
        return this.chatService.sendMessage(userId, dto);
    }

    @Get('conversation/:userId')
    @ApiOperation({ summary: 'Get DM conversation history with a user' })
    getConversation(@Param('userId') otherUserId: string, @CurrentUser('id') userId: string) {
        return this.chatService.getConversation(userId, otherUserId);
    }

    @Get('room/:roomId')
    @ApiOperation({ summary: 'Get messages from a group chat room' })
    getRoom(@Param('roomId') roomId: string) {
        return this.chatService.getRoomMessages(roomId);
    }
}
