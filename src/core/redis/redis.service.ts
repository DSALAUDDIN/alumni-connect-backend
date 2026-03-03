import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis;
    private isConnected = false;

    onModuleInit() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            lazyConnect: true,
            retryStrategy: (times) => {
                // Stop retrying after 5 attempts — Redis is optional in dev
                if (times >= 5) {
                    this.logger.warn('Redis not available — running without cache/presence features.');
                    return null;
                }
                const delay = Math.min(times * 500, 3000);
                this.logger.warn(`Redis retry #${times}, waiting ${delay}ms`);
                return delay;
            },
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            this.logger.log('✅ Redis connected');
        });
        this.client.on('close', () => {
            this.isConnected = false;
        });
        this.client.on('error', () => {
            this.isConnected = false;
            // Silently swallowed — prevents log spam
        });

        this.client.connect().catch(() => {
            this.logger.warn('Redis not reachable — presence & caching features disabled.');
        });
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            await this.client.quit();
            this.logger.log('Redis disconnected');
        }
    }

    // ──────────────────────────────────────────────
    //  Core Key/Value
    // ──────────────────────────────────────────────

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (!this.isConnected) return;
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            } else {
                await this.client.set(key, value);
            }
        } catch { /* silent */ }
    }

    async get(key: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            return await this.client.get(key);
        } catch { return null; }
    }

    async del(...keys: string[]): Promise<void> {
        if (!this.isConnected) return;
        try { await this.client.del(...keys); } catch { /* silent */ }
    }

    async exists(key: string): Promise<boolean> {
        if (!this.isConnected) return false;
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch { return false; }
    }

    async ttl(key: string): Promise<number> {
        if (!this.isConnected) return -2;
        try { return await this.client.ttl(key); } catch { return -2; }
    }

    // ──────────────────────────────────────────────
    //  JSON Helpers
    // ──────────────────────────────────────────────

    async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        await this.set(key, JSON.stringify(value), ttlSeconds);
    }

    async getJson<T>(key: string): Promise<T | null> {
        const raw = await this.get(key);
        if (!raw) return null;
        try { return JSON.parse(raw) as T; } catch { return null; }
    }

    // ──────────────────────────────────────────────
    //  Online Presence (for Chat)
    // ──────────────────────────────────────────────

    async setUserOnline(userId: string, socketId: string): Promise<void> {
        await this.set(`online:${userId}`, socketId, 30);
    }

    async setUserOffline(userId: string): Promise<void> {
        await this.del(`online:${userId}`);
    }

    async getUserSocketId(userId: string): Promise<string | null> {
        return this.get(`online:${userId}`);
    }

    async isUserOnline(userId: string): Promise<boolean> {
        return this.exists(`online:${userId}`);
    }

    // ──────────────────────────────────────────────
    //  Health Check
    // ──────────────────────────────────────────────

    async checkHealth(): Promise<{ status: string; latencyMs?: number; error?: string }> {
        if (!this.isConnected) return { status: 'down', error: 'Not connected' };
        try {
            const start = Date.now();
            await this.client.ping();
            return { status: 'up', latencyMs: Date.now() - start };
        } catch (error) {
            return { status: 'down', error: error.message };
        }
    }
}
