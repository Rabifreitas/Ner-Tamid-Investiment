/**
 * Ner Tamid - Database Setup Script
 * 
 * Initializes the database schema and seed data.
 * 
 * #NerTamidEternal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    console.log('🕎 Initializing Ner Tamid Database...');

    try {
        // First connection to 'postgres' to create 'ner_tamid' if it doesn't exist
        const { Pool } = await import('pg');
        const adminPool = new Pool({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            database: 'postgres'
        });

        const dbName = process.env.DB_NAME || 'ner_tamid';
        const checkRes = await adminPool.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);

        if (checkRes.rowCount === 0) {
            console.log(`Creating database ${dbName}...`);
            await adminPool.query(`CREATE DATABASE ${dbName}`);
        }
        await adminPool.end();

        // Read schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema (using the main db pool which connects to ner_tamid)
        await db.query(schema);

        console.log('✅ Database schema and seed data initialized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase();
