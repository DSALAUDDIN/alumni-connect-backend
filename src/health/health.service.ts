import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { NotificationsService } from '../core/notifications/notifications.service';
import { RedisService } from '../core/redis/redis.service';

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService,
        private readonly redis: RedisService,
    ) { }

    async checkAll() {
        const [postgresql, redis, nodemailer, firebaseAdmin] = await Promise.all([
            this.checkPostgres(),
            this.redis.checkHealth(),
            this.notifications.checkMailer(),
            this.notifications.checkFirebase(),
        ]);

        const services = { postgresql, redis, nodemailer, firebaseAdmin };
        const allUp = Object.values(services).every((s) => s.status === 'up');

        return {
            status: allUp ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            services,
        };
    }

    private async checkPostgres(): Promise<{ status: string; error?: string }> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'up' };
        } catch (error) {
            this.logger.error(`PostgreSQL health check failed: ${error.message}`);
            return { status: 'down', error: error.message };
        }
    }
}
