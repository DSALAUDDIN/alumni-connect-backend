import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    ConnectedSocket,
    MessageBody,
    WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import { RedisService } from '../core/redis/redis.service';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    SendMessagePayload,
    MessagePayload,
} from './chat.types';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
    userId?: string;
    userFirstName?: string | null;
    userLastName?: string | null;
    userAvatar?: string | null;
};

@WebSocketGateway({
    namespace: '/chat',
    cors: {
        origin: '*', // Restrict in production
        credentials: true,
    },
})
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: TypedServer;
    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) { }

    afterInit(server: TypedServer) {
        this.logger.log('🔌 Chat WebSocket Gateway initialized at /chat');
    }

    // ─── Connection Lifecycle ──────────────────────────────────────────────────

    async handleConnection(socket: TypedSocket) {
        try {
            const user = await this.authenticateSocket(socket);
            if (!user) {
                socket.emit('error', 'Unauthorized: invalid or missing token');
                socket.disconnect(true);
                return;
            }

            socket.userId = user.id;
            socket.userFirstName = user.firstName;
            socket.userLastName = user.lastName;
            socket.userAvatar = user.avatarUrl;

            // Track presence in Redis — 30s TTL, refreshed by heartbeat
            await this.redis.setUserOnline(user.id, socket.id);

            // Auto-join a personal room (for direct messages)
            socket.join(`user:${user.id}`);

            // Notify others this user came online
            socket.broadcast.emit('presence:online', user.id);

            this.logger.log(`✅ Connected:  ${user.firstName} ${user.lastName} [${socket.id}]`);
        } catch {
            socket.disconnect(true);
        }
    }

    async handleDisconnect(socket: TypedSocket) {
        if (socket.userId) {
            await this.redis.setUserOffline(socket.userId);
            this.server.emit('presence:offline', socket.userId);
            this.logger.log(`❌ Disconnected: [${socket.userId}] socket ${socket.id}`);
        }
    }

    // ─── Event Handlers ───────────────────────────────────────────────────────

    @SubscribeMessage('room:join')
    async handleJoinRoom(
        @ConnectedSocket() socket: TypedSocket,
        @MessageBody() roomId: string,
    ) {
        socket.join(`room:${roomId}`);
        this.logger.log(`[${socket.userId}] joined room:${roomId}`);
    }

    @SubscribeMessage('room:leave')
    async handleLeaveRoom(
        @ConnectedSocket() socket: TypedSocket,
        @MessageBody() roomId: string,
    ) {
        socket.leave(`room:${roomId}`);
        this.logger.log(`[${socket.userId}] left room:${roomId}`);
    }

    @SubscribeMessage('message:send')
    async handleMessage(
        @ConnectedSocket() socket: TypedSocket,
        @MessageBody() payload: SendMessagePayload,
    ) {
        if (!socket.userId) throw new WsException('Unauthenticated');

        const { to, type, content } = payload;

        // Persist to PostgreSQL via Prisma
        const saved = await this.prisma.message.create({
            data: {
                content,
                senderId: socket.userId,
                receiverId: type === 'dm' ? to : undefined,
                chatRoomId: type === 'room' ? to : undefined,
            },
        });

        const outgoing: MessagePayload = {
            id: saved.id,
            content: saved.content,
            senderId: socket.userId,
            senderName: `${socket.userFirstName} ${socket.userLastName}`,
            senderAvatar: socket.userAvatar ?? null,
            to,
            type,
            createdAt: saved.createdAt.toISOString(),
        };

        if (type === 'room') {
            // Broadcast to all sockets in the room
            this.server.to(`room:${to}`).emit('message:new', outgoing);
        } else {
            // DM: send to recipient's personal room + echo back to sender
            this.server.to(`user:${to}`).emit('message:new', outgoing);
            socket.emit('message:new', outgoing);
        }
    }

    @SubscribeMessage('heartbeat')
    async handleHeartbeat(@ConnectedSocket() socket: TypedSocket) {
        if (socket.userId) {
            // Refresh the 30s online TTL in Redis
            await this.redis.setUserOnline(socket.userId, socket.id);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async authenticateSocket(socket: TypedSocket) {
        try {
            // Token can come from handshake.auth.token or query param
            const rawToken: string =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                socket.handshake.query?.token as string;

            if (!rawToken) return null;

            const payload = await this.jwtService.verifyAsync<{
                sub: string;
                email: string;
                role: string;
            }>(rawToken);

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
            });

            return user;
        } catch {
            return null;
        }
    }

    // ─── Server-Push Utilities (callable from other services) ─────────────────

    /**
     * Push a real-time message to a specific user from anywhere in the app.
     */
    async pushToUser(userId: string, event: keyof ServerToClientEvents, data: unknown) {
        this.server.to(`user:${userId}`).emit(event as any, data as any);
    }

    /**
     * Push a real-time message to an entire room.
     */
    async pushToRoom(roomId: string, event: keyof ServerToClientEvents, data: unknown) {
        this.server.to(`room:${roomId}`).emit(event as any, data as any);
    }
}
