/**
 * Ner Tamid - Social Login Migration
 * 
 * Adds google_id and apple_id fields to the users table
 * #NerTamidEternal
 */

import { db } from './client.js';

async function migrate() {
    console.log('🕎 Iniciando Migração: Social Login Accounts...');

    try {
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';
        `);

        // Add indexes for social IDs
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
            CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id);
        `);

        console.log('✅ Migração Concluída: Campos de Social Login adicionados.');
    } catch (err) {
        console.error('❌ Erro na migração:', err);
    } finally {
        process.exit();
    }
}

migrate();
