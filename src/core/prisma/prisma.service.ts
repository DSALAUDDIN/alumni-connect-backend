import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private readonly client: PrismaClient;

    // Expose model accessors used across the app
    get user() { return this.client.user; }
    get post() { return this.client.post; }
    get comment() { return this.client.comment; }
    get like() { return this.client.like; }
    get group() { return this.client.group; }
    get groupMember() { return this.client.groupMember; }
    get marketplaceItem() { return this.client.marketplaceItem; }
    get event() { return this.client.event; }
    get eventRSVP() { return this.client.eventRSVP; }
    get message() { return this.client.message; }
    get emergencyAlert() { return this.client.emergencyAlert; }
    get job() { return this.client.job; }
    get mentorship() { return this.client.mentorship; }
    get project() { return this.client.project; }

    // Expose raw query method
    get $queryRaw() { return this.client.$queryRaw.bind(this.client); }
    get $executeRaw() { return this.client.$executeRaw.bind(this.client); }
    get $transaction() { return this.client.$transaction.bind(this.client); }

    constructor() {
        this.client = new PrismaClient({ log: ['warn', 'error'] });
    }

    async onModuleInit() {
        await this.client.$connect();
        this.logger.log('✅ Database connected');
    }

    async onModuleDestroy() {
        await this.client.$disconnect();
        this.logger.log('Database disconnected');
    }
}
