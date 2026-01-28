/**
 * Ner Tamid - Exchange Service
 * 
 * Manages user exchange connections and API key cycles
 * 
 * #NerTamidEternal
 */

import { Pool } from 'pg';
import { encrypt, decrypt } from '../utils/encryption.js';
import ccxt from 'ccxt';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    defaultMeta: { service: 'exchange-service' },
    transports: [new transports.Console()],
});

export interface ExchangeKey {
    id: string;
    userId: string;
    exchangeId: string;
    apiKey: string;
    apiSecret: string;
    passphrase?: string;
    isActive: boolean;
}

export class ExchangeService {
    constructor(private db: Pool) { }

    /**
     * Store and encrypt user exchange keys
     */
    async saveExchangeKeys(params: Omit<ExchangeKey, 'id' | 'isActive'>) {
        const encryptedKey = encrypt(params.apiKey);
        const encryptedSecret = encrypt(params.apiSecret);
        const encryptedPassphrase = params.passphrase ? encrypt(params.passphrase) : null;

        const result = await this.db.query(
            `INSERT INTO user_exchange_keys (user_id, exchange_id, api_key, api_secret, passphrase)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, exchange_id) 
             DO UPDATE SET 
                api_key = EXCLUDED.api_key,
                api_secret = EXCLUDED.api_secret,
                passphrase = EXCLUDED.passphrase,
                updated_at = CURRENT_TIMESTAMP
             RETURNING id, exchange_id, is_active, created_at`,
            [params.userId, params.exchangeId, encryptedKey, encryptedSecret, encryptedPassphrase]
        );

        return result.rows[0];
    }

    /**
     * Get user's exchange balance
     */
    async getBalance(userId: string, exchangeId: string) {
        const keys = await this.getUserExchangeKeys(userId, exchangeId);
        if (!keys) throw new Error('No API keys found for this exchange');

        try {
            // @ts-ignore
            const exchangeClass = ccxt[exchangeId];
            if (!exchangeClass) throw new Error(`Exchange ${exchangeId} not supported by CCXT`);

            const exchange = new exchangeClass({
                apiKey: decrypt(keys.api_key),
                secret: decrypt(keys.api_secret),
                password: keys.passphrase ? decrypt(keys.passphrase) : undefined,
            });

            const balance = await exchange.fetchBalance();
            return balance;
        } catch (err) {
            logger.error(`Failed to fetch balance from ${exchangeId}:`, err);
            throw new Error(`Exchange Error: ${(err as any).message}`);
        }
    }

    /**
     * List all connected exchanges for a user
     */
    async listUserExchanges(userId: string) {
        const result = await this.db.query(
            'SELECT id, exchange_id, is_active, last_used_at, created_at FROM user_exchange_keys WHERE user_id = $1',
            [userId]
        );
        return result.rows;
    }

    private async getUserExchangeKeys(userId: string, exchangeId: string) {
        const result = await this.db.query(
            'SELECT * FROM user_exchange_keys WHERE user_id = $1 AND exchange_id = $2 AND is_active = TRUE',
            [userId, exchangeId]
        );
        return result.rows[0];
    }
}
