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
    console.log('🕎 Running Audit Log Migration...');
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(100) NOT NULL, -- 'order_execution', 'system_start', 'security_event'
                resource_type VARCHAR(50), -- 'limit_order', 'api_key'
                resource_id UUID,
                details JSONB,
                severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
        `);
        console.log('✅ Audit Log Migration successful!');
    } catch (err) {
        console.error('❌ Audit Log Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
