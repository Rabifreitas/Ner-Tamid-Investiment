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
    console.log('🕎 Running limit_orders migration...');
    const client = await pool.connect();
    try {
        await client.query(`
            -- CORE FUNCTIONS
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TABLE IF NOT EXISTS limit_orders (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
                symbol VARCHAR(20) NOT NULL,
                order_type VARCHAR(10) NOT NULL,
                target_price DECIMAL(20, 8) NOT NULL,
                quantity DECIMAL(20, 8) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_limit_orders_user ON limit_orders(user_id);
            CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status);

            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_limit_orders_update') THEN
                    CREATE TRIGGER audit_limit_orders_update
                        BEFORE UPDATE ON limit_orders
                        FOR EACH ROW
                        EXECUTE FUNCTION update_updated_at_column();
                END IF;
            END $$;
        `);
        console.log('✅ Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
