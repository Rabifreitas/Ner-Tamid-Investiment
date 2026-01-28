import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useLiveStore } from '../stores/liveStore';

export const useSocket = (token: string | null) => {
    const socketRef = useRef<Socket | null>(null);
    const { updatePrice, addNotification } = useLiveStore();

    useEffect(() => {
        if (!token) return;

        // Initialize socket connection
        const socket = io(window.location.host === 'localhost:5173' ? 'http://localhost:3000' : '/', {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🕎 Connected to Ner Tamid Real-time Hub');
        });

        socket.on('price_update', (data: { symbol: string; price: number }) => {
            updatePrice(data.symbol, data.price);
        });

        socket.on('order_executed', (data: any) => {
            addNotification({
                type: 'execution',
                message: `Ordem executada: ${data.symbol} @ $${data.executedPrice}`,
                timestamp: new Date(),
                ...data
            });
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });

        return () => {
            socket.disconnect();
        };
    }, [token, updatePrice, addNotification]);

    return socketRef.current;
};
