/**
 * Ner Tamid - Social Service
 * 
 * Logic for community engagement, leaderboards, and impact feed
 * #NerTamidEternal
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { socketService } from './socketService.js';

export class SocialService {
    constructor(private db: Pool) { }

    /**
     * Add an event to the social feed
     */
    async addToFeed(params: {
        userId: string;
        eventType: 'donation' | 'trade_win' | 'new_user';
        amount?: number;
        charityName?: string;
        message?: string;
        isAnonymous?: boolean;
    }) {
        const id = uuidv4();
        const result = await this.db.query(`
            INSERT INTO social_feed (id, user_id, event_type, amount, charity_name, message, is_anonymous)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [id, params.userId, params.eventType, params.amount, params.charityName, params.message, params.isAnonymous ?? true]);

        const event = result.rows[0];

        // Broadcast to all connected clients
        socketService.broadcastEvent('social_event', {
            type: event.event_type,
            amount: event.amount ? parseFloat(event.amount) : null,
            charityName: event.charity_name,
            message: event.message,
            timestamp: event.created_at,
            // Only send name if not anonymous
            userName: event.is_anonymous ? 'Usuário Anônimo' : 'Um Membro da Comunidade'
        });

        return event;
    }

    /**
     * Get recent feed items
     */
    async getRecentFeed(limit: number = 20) {
        const result = await this.db.query(`
            SELECT f.*, u.full_name as raw_userName
            FROM social_feed f
            LEFT JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map(row => ({
            ...row,
            userName: row.is_anonymous ? 'Usuário Anônimo' : row.raw_userName
        }));
    }

    /**
     * Get impact leaderboard
     * Ranked by total charity donated
     */
    async getLeaderboard(limit: number = 10) {
        const result = await this.db.query(`
            SELECT 
                u.id,
                CASE WHEN u.is_public_impact THEN u.full_name ELSE 'Usuário Seguro' END as name,
                SUM(c.charity_amount) as total_impact,
                COUNT(c.id) as donations_count
            FROM users u
            JOIN charity_transactions c ON u.id = c.user_id
            WHERE c.status = 'completed'
            GROUP BY u.id
            ORDER BY total_impact DESC
            LIMIT $1
        `, [limit]);

        return result.rows;
    }
}
