// ─── Chat Gateway Event Types ─────────────────────────────────────────────────

export interface ClientToServerEvents {
    /** Join a specific chat room (group) */
    'room:join': (roomId: string) => void;
    /** Leave a chat room */
    'room:leave': (roomId: string) => void;
    /** Send a message to a room or directly to a user */
    'message:send': (payload: SendMessagePayload) => void;
    /** Client heartbeat to refresh online presence in Redis */
    heartbeat: () => void;
}

export interface ServerToClientEvents {
    /** Broadcast a new message to all room/user subscribers */
    'message:new': (message: MessagePayload) => void;
    /** Notify a user that they are now online */
    'presence:online': (userId: string) => void;
    /** Notify when a user goes offline */
    'presence:offline': (userId: string) => void;
    /** Server-side error message */
    error: (message: string) => void;
}

export interface SendMessagePayload {
    /** Target: either a roomId (group chat) or a receiverId (DM) */
    to: string;
    /** 'room' for group chat, 'dm' for direct message */
    type: 'room' | 'dm';
    content: string;
}

export interface MessagePayload {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
    to: string;
    type: 'room' | 'dm';
    createdAt: string;
}

export interface AuthenticatedSocket {
    userId: string;
    email: string;
    role: string;
}
