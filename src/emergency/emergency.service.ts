import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { NotificationsService } from '../core/notifications/notifications.service';
import { CreateEmergencyAlertDto } from './dto/create-alert.dto';

@Injectable()
export class EmergencyService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService,
    ) { }

    async create(reportedById: string, dto: CreateEmergencyAlertDto) {
        const alert = await this.prisma.emergencyAlert.create({
            data: { ...dto, reportedById },
        });

        // Broadcast a push to all users – in production, send to FCM topic e.g. 'emergency'
        await this.notifications.sendPush('TOPIC_EMERGENCY_PLACEHOLDER', {
            title: `🚨 Emergency Alert: ${dto.type}`,
            body: dto.message,
            data: { alertId: alert.id, type: dto.type },
        });

        return alert;
    }

    async findAll() {
        return this.prisma.emergencyAlert.findMany({
            where: { status: 'ACTIVE' },
            include: { reportedBy: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async resolve(id: string) {
        return this.prisma.emergencyAlert.update({
            where: { id },
            data: { status: 'RESOLVED', resolvedAt: new Date() },
        });
    }
}
