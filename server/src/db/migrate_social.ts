import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    console.log('🕎 Running Phase 8 Social Migration...');
    const client = await pool.connect();
    try {
        await client.query(`
            -- SOCIAL FEED (Anonymized)
            CREATE TABLE IF NOT EXISTS social_feed (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                event_type VARCHAR(50) NOT NULL, -- 'donation', 'trade_win', 'new_user'
                amount DECIMAL(20, 8),
                charity_name VARCHAR(100),
                message TEXT,
                is_anonymous BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- VOTING ROUNDS
            CREATE TABLE IF NOT EXISTS charity_voting_rounds (
                id UUID PRIMARY KEY,
                month INT NOT NULL,
                year INT NOT NULL,
                status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed'
                winner_id UUID REFERENCES charity_organizations(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(month, year)
            );

            -- CHARITY VOTES
            CREATE TABLE IF NOT EXISTS charity_votes (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                round_id UUID NOT NULL REFERENCES charity_voting_rounds(id) ON DELETE CASCADE,
                charity_id UUID NOT NULL REFERENCES charity_organizations(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, round_id) -- One vote per user per round
            );

            CREATE INDEX IF NOT EXISTS idx_social_feed_created ON social_feed(created_at);
        `);
        console.log('✅ Social Migration successful!');
    } catch (err) {
        console.error('❌ Social Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
