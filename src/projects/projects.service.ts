import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(leaderId: string, dto: CreateProjectDto) {
        return this.prisma.project.create({ data: { ...dto, leaderId } });
    }

    async findAll() {
        return this.prisma.project.findMany({
            include: { leader: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.project.findUniqueOrThrow({ where: { id } });
    }

    async remove(id: string) {
        await this.prisma.project.delete({ where: { id } });
        return { message: 'Project deleted' };
    }
}
