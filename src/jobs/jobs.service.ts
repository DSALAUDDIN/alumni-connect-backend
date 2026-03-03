import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(postedById: string, dto: CreateJobDto) {
        return this.prisma.job.create({
            data: { ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined, postedById },
        });
    }

    async findAll() {
        return this.prisma.job.findMany({
            include: { postedBy: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.job.findUniqueOrThrow({ where: { id } });
    }

    async remove(id: string) {
        await this.prisma.job.delete({ where: { id } });
        return { message: 'Job removed' };
    }
}
