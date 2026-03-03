import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) { }

    async sendMessage(senderId: string, dto: SendMessageDto) {
        return this.prisma.message.create({
            data: { content: dto.content, senderId, receiverId: dto.receiverId, chatRoomId: dto.chatRoomId },
            include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        });
    }

    async getConversation(userAId: string, userBId: string) {
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userAId, receiverId: userBId },
                    { senderId: userBId, receiverId: userAId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getRoomMessages(chatRoomId: string) {
        return this.prisma.message.findMany({
            where: { chatRoomId },
            include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }
}
