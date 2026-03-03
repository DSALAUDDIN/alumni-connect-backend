import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { CreateMarketplaceItemDto } from './dto/create-item.dto';

@Injectable()
export class MarketplaceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
    ) { }

    async create(
        sellerId: string,
        dto: CreateMarketplaceItemDto,
        files?: Express.Multer.File[],
    ) {
        let mediaUrls = dto.mediaUrls ?? [];

        if (files && files.length > 0) {
            const uploaded = await this.cloudinary.uploadMany(files, 'marketplace');
            mediaUrls = uploaded.map((r) => r.url);
        }

        return this.prisma.marketplaceItem.create({
            data: { ...dto, mediaUrls, sellerId },
        });
    }

    async findAll() {
        return this.prisma.marketplaceItem.findMany({
            where: { status: 'AVAILABLE' },
            include: { seller: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.marketplaceItem.findUniqueOrThrow({ where: { id } });
    }

    async remove(id: string) {
        await this.prisma.marketplaceItem.delete({ where: { id } });
        return { message: 'Item removed' };
    }
}
