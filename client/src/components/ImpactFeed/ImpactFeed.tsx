import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../../stores/liveStore';
import { Heart, Zap, Globe, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ImpactFeed.css';

interface FeedItem {
    id: string;
    eventType: string;
    amount?: number;
    charityName?: string;
    message?: string;
    userName: string;
    timestamp: string;
}

export const ImpactFeed: React.FC = () => {
    const [events, setEvents] = useState<FeedItem[]>([]);
    const socialNotifications = useLiveStore((state: any) =>
        state.notifications.filter((n: any) => n.type === 'social_event')
    );

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await fetch('/api/social/feed').then(r => r.json());
                setEvents(res);
            } catch (err) {
                console.error('Failed to fetch feed', err);
            }
        };
        fetchInitial();
    }, []);

    // Merge real-time socket events
    useEffect(() => {
        if (socialNotifications.length > 0) {
            const latest = socialNotifications[0];
            setEvents(prev => [latest, ...prev].slice(0, 30));
        }
    }, [socialNotifications]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'donation': return <Heart className="icon-heart" />;
            case 'trade_win': return <Zap className="icon-zap" />;
            default: return <Globe className="icon-globe" />;
        }
    };

    return (
        <div className="impact-feed-container">
            <h3 className="feed-title"><Shield size={18} /> Impact Feed</h3>
            <div className="feed-list">
                <AnimatePresence>
                    {events.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="feed-card"
                        >
                            <div className="card-icon">{getIcon(event.eventType)}</div>
                            <div className="card-content">
                                <p className="event-desc">
                                    <strong>{event.userName}</strong>
                                    {event.eventType === 'donation' ? (
                                        <> destinou <span className="highlight">${parseFloat(event.amount as any).toFixed(2)}</span> para <strong>{event.charityName}</strong></>
                                    ) : (
                                        <> realizou um lucro e gerou impacto positivo!</>
                                    )}
                                </p>
                                <span className="timestamp">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {events.length === 0 && <p className="empty">Aguardando coletividade...</p>}
            </div>
        </div>
    );
};
