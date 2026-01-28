/**
 * Ner Tamid - Socket Service
 * 
 * Manages real-time bidirectional communication
 * #NerTamidEternal
 */

import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    defaultMeta: { service: 'socket-service' },
    transports: [new transports.Console()],
});

export class SocketService {
    private io: Server | null = null;

    constructor() { }

    /**
     * Initialize the socket server
     */
    init(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        // Authentication Middleware
        this.io.use((socket: Socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
                (socket as any).userId = decoded.userId;
                next();
            } catch (err) {
                return next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            const userId = (socket as any).userId;
            logger.info(`User connected: ${userId} (Socket: ${socket.id})`);

            // Join a private room for the user
            socket.join(`user:${userId}`);

            socket.on('disconnect', () => {
                logger.info(`User disconnected: ${userId}`);
            });
        });

        logger.info('Socket Service initialized');
        return this.io;
    }

    /**
     * Broadcast price update for a symbol
     */
    broadcastPrice(symbol: string, price: number) {
        if (!this.io) return;
        this.io.emit('price_update', { symbol, price, timestamp: new Date() });
    }

    /**
     * Broadcast a generic event to all connected clients
     */
    broadcastEvent(event: string, data: any) {
        if (!this.io) return;
        this.io.emit(event, data);
    }

    /**
     * Send order execution notification to a specific user
     */
    notifyOrderExecuted(userId: string, orderData: any) {
        if (!this.io) return;
        this.io.to(`user:${userId}`).emit('order_executed', orderData);
    }
}

export const socketService = new SocketService();
