import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateGroupDto) {
        return this.prisma.group.create({ data: dto });
    }

    async findAll() {
        return this.prisma.group.findMany({
            include: { _count: { select: { members: true, posts: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.group.findUniqueOrThrow({
            where: { id },
            include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } } },
        });
    }

    async join(groupId: string, userId: string) {
        return this.prisma.groupMember.upsert({
            where: { groupId_userId: { groupId, userId } },
            create: { groupId, userId },
            update: {},
        });
    }

    async leave(groupId: string, userId: string) {
        await this.prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
        return { message: 'Left group successfully' };
    }
}
