import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
    id: true, email: true, firstName: true, lastName: true,
    avatarUrl: true, role: true, degree: true, graduationYear: true,
    motto: true, isVerified: true, createdAt: true,
};

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
    ) { }

    async findAll(search?: string) {
        return this.prisma.user.findMany({
            where: search
                ? {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : undefined,
            select: USER_SELECT,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
        if (!user) throw new NotFoundException(`User ${id} not found`);
        return user;
    }

    async update(id: string, dto: UpdateUserDto) {
        return this.prisma.user.update({ where: { id }, data: dto, select: USER_SELECT });
    }

    async remove(id: string) {
        await this.prisma.user.delete({ where: { id } });
        return { message: 'User deleted successfully' };
    }

    /**
     * Upload and set a user's avatar via Cloudinary.
     * Uses the userId as the Cloudinary public_id so overwriting replaces the old image.
     */
    async uploadAvatar(userId: string, file: Express.Multer.File) {
        const result = await this.cloudinary.uploadBuffer(
            file.buffer,
            'avatars',
            `user_${userId}`,
        );

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: result.url },
            select: USER_SELECT,
        });

        return {
            message: 'Avatar updated successfully',
            avatarUrl: result.url,
            user,
        };
    }
}
