import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class FeedService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
    ) { }

    async create(authorId: string, dto: CreatePostDto, files?: Express.Multer.File[]) {
        let mediaUrls = dto.mediaUrls ?? [];

        // If files were provided via multipart, upload them first
        if (files && files.length > 0) {
            const uploaded = await this.cloudinary.uploadMany(files, 'feed');
            mediaUrls = uploaded.map((r) => r.url);
        }

        return this.prisma.post.create({
            data: { content: dto.content, mediaUrls, authorId, groupId: dto.groupId },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
        });
    }

    async findAll(groupId?: string) {
        return this.prisma.post.findMany({
            where: groupId ? { groupId } : undefined,
            include: {
                author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                _count: { select: { likes: true, comments: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async findOne(id: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                comments: {
                    include: {
                        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: { select: { likes: true } },
            },
        });
        if (!post) throw new NotFoundException(`Post ${id} not found`);
        return post;
    }

    async remove(id: string) {
        await this.prisma.post.delete({ where: { id } });
        return { message: 'Post deleted' };
    }

    async toggleLike(postId: string, userId: string) {
        const existing = await this.prisma.like.findUnique({
            where: { postId_authorId: { postId, authorId: userId } },
        });
        if (existing) {
            await this.prisma.like.delete({ where: { id: existing.id } });
            return { liked: false };
        }
        await this.prisma.like.create({ data: { postId, authorId: userId } });
        return { liked: true };
    }

    async addComment(postId: string, authorId: string, content: string) {
        return this.prisma.comment.create({
            data: { postId, authorId, content },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
        });
    }
}
