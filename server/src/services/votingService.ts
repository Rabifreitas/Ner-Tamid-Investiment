/**
 * Ner Tamid - Voting Service
 * 
 * Logic for charitable voting rounds and community governance
 * #NerTamidEternal
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class VotingService {
    constructor(private db: Pool) { }

    /**
     * Get or create active voting round
     */
    async getOrCreateActiveRound() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const result = await this.db.query(
            'SELECT * FROM charity_voting_rounds WHERE month = $1 AND year = $2',
            [month, year]
        );

        if (result.rows.length > 0) {
            return result.rows[0];
        }

        const id = uuidv4();
        const insertRes = await this.db.query(
            'INSERT INTO charity_voting_rounds (id, month, year, status) VALUES ($1, $2, $3, \'active\') RETURNING *',
            [id, month, year]
        );

        return insertRes.rows[0];
    }

    /**
     * Cast a vote
     */
    async castVote(userId: string, charityId: string) {
        const round = await this.getOrCreateActiveRound();

        if (round.status !== 'active') {
            throw new Error('Voting round is not active');
        }

        const id = uuidv4();
        await this.db.query(`
            INSERT INTO charity_votes (id, user_id, round_id, charity_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, round_id) 
            DO UPDATE SET charity_id = $4, created_at = CURRENT_TIMESTAMP
        `, [id, userId, round.id, charityId]);

        return { success: true, message: 'Voto registrado com sucesso! 🕎' };
    }

    /**
     * Get current standings for active round
     */
    async getStandings() {
        const round = await this.getOrCreateActiveRound();

        const result = await this.db.query(`
            SELECT 
                c.id,
                c.name,
                c.category,
                COUNT(v.id) as vote_count
            FROM charity_organizations c
            LEFT JOIN charity_votes v ON c.id = v.charity_id AND v.round_id = $1
            WHERE c.is_verified = TRUE
            GROUP BY c.id
            ORDER BY vote_count DESC
        `, [round.id]);

        return {
            round,
            standings: result.rows
        };
    }
}
