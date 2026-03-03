import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateMentorshipDto } from './dto/create-mentorship.dto';

@Injectable()
export class MentorshipService {
    constructor(private readonly prisma: PrismaService) { }

    async request(menteeId: string, dto: CreateMentorshipDto) {
        return this.prisma.mentorship.create({
            data: { menteeId, mentorId: dto.mentorId, topic: dto.topic, notes: dto.notes },
        });
    }

    async findAll() {
        return this.prisma.mentorship.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async accept(id: string) {
        return this.prisma.mentorship.update({ where: { id }, data: { status: 'ACTIVE' } });
    }

    async complete(id: string) {
        return this.prisma.mentorship.update({ where: { id }, data: { status: 'COMPLETED' } });
    }
}
