import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AccountStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async getStats() {
        const [totalUsers, pendingUsers, activeUsers, posts, groups, jobs, events, alerts] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: AccountStatus.PENDING } }),
            this.prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
            this.prisma.post.count(),
            this.prisma.group.count(),
            this.prisma.job.count(),
            this.prisma.event.count(),
            this.prisma.emergencyAlert.count(),
        ]);

        return { totalUsers, pendingUsers, activeUsers, posts, groups, jobs, events, emergencyAlerts: alerts };
    }

    // ── Get all pending users waiting for approval ──────────────────────────
    async getPendingUsers() {
        return this.prisma.user.findMany({
            where: { status: AccountStatus.PENDING },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                graduationYear: true,
                department: true,
                studentId: true,
                proofDocumentUrl: true,
                currentRole: true,
                currentCompany: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
    }

    // ── Get all users (with optional filter) ─────────────────────────────────
    async getAllUsers(status?: AccountStatus) {
        return this.prisma.user.findMany({
            where: status ? { status } : {},
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                status: true,
                graduationYear: true,
                department: true,
                createdAt: true,
            },
        });
    }

    // ── Approve a pending user ────────────────────────────────────────────────
    async approveUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        if (user.status === AccountStatus.ACTIVE) {
            return { message: 'User is already active', user };
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: { status: AccountStatus.ACTIVE, isVerified: true },
            select: { id: true, firstName: true, lastName: true, email: true, status: true, role: true },
        });

        // TODO: Send FCM push notification to the user's device here
        // await firebaseAdmin.messaging().send({ token: user.fcmToken, notification: { title: '...', body: '...' } });

        return { message: `User ${updated.firstName} ${updated.lastName} has been approved successfully.`, user: updated };
    }

    // ── Block (or unblock) a user ─────────────────────────────────────────────
    async setUserStatus(id: string, status: AccountStatus, requestingUser: { role: string; id: string }) {
        const targetUser = await this.prisma.user.findUnique({ where: { id } });
        if (!targetUser) throw new NotFoundException('User not found');

        // Prevent admins from blocking other admins or super admins — only SUPER_ADMIN can
        const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
        if (
            adminRoles.includes(targetUser.role) &&
            requestingUser.role !== UserRole.SUPER_ADMIN
        ) {
            throw new ForbiddenException('Only a SUPER_ADMIN can change the status of an admin account.');
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: { status },
            select: { id: true, firstName: true, lastName: true, email: true, status: true, role: true },
        });

        const action = status === AccountStatus.BLOCKED ? 'blocked' : 'reactivated';
        return { message: `User has been ${action} successfully.`, user: updated };
    }

    // ── Promote/Demote a user's role (SUPER_ADMIN only) ──────────────────────
    async setUserRole(id: string, role: UserRole, requestingUser: { role: string; id: string }) {
        if (requestingUser.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only a SUPER_ADMIN can change user roles.');
        }

        const targetUser = await this.prisma.user.findUnique({ where: { id } });
        if (!targetUser) throw new NotFoundException('User not found');

        // Prevent modifying another SUPER_ADMIN
        if (targetUser.role === UserRole.SUPER_ADMIN && targetUser.id !== requestingUser.id) {
            throw new ForbiddenException('Cannot modify the role of another SUPER_ADMIN.');
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, firstName: true, lastName: true, email: true, status: true, role: true },
        });

        return { message: `User role updated to ${role} successfully.`, user: updated };
    }

    async getRecentUsers(take = 10) {
        return this.prisma.user.findMany({
            take,
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, avatarUrl: true, createdAt: true },
        });
    }
}
