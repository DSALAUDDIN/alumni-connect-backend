import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateEventDto) {
        return this.prisma.event.create({ data: { ...dto, date: new Date(dto.date) } });
    }

    async findAll() {
        return this.prisma.event.findMany({
            include: { _count: { select: { rsvps: true } } },
            orderBy: { date: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.event.findUniqueOrThrow({
            where: { id },
            include: { rsvps: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
        });
    }

    async rsvp(eventId: string, userId: string, status: 'GOING' | 'MAYBE' | 'NOT_GOING' = 'GOING') {
        return this.prisma.eventRSVP.upsert({
            where: { eventId_userId: { eventId, userId } },
            create: { eventId, userId, status },
            update: { status },
        });
    }
}
