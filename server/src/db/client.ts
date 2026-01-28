/**
 * Ner Tamid - Database Client
 * 
 * PostgreSQL connection pool
 * 
 * #NerTamidEternal
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ner_tamid',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
db.on('connect', () => {
    console.log('🕎 Connected to PostgreSQL database');
});

db.on('error', (err) => {
    console.error('Database pool error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await db.end();
    console.log('Database pool closed');
    process.exit(0);
});

export default db;
