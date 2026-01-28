/**
 * Ner Tamid - Authentication Service
 * 
 * Business logic for user authentication and session management
 * 
 * #NerTamidEternal
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { MINIMUM_CHARITY_PERCENTAGE } from './charityEngine.js';

export class AuthService {
    constructor(private db: Pool) { }

    /**
     * Hash a password
     */
    async hashPassword(password: string): Promise<string> {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        return bcrypt.hash(password, rounds);
    }

    /**
     * Verify a password against a hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate a JWT for a user
     */
    generateToken(user: { id: string, email: string }): string {
        return jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
        );
    }

    /**
     * Generate a Refresh Token
     */
    generateRefreshToken(user: { id: string }): string {
        return jwt.sign(
            { userId: user.id },
            process.env.REFRESH_TOKEN_SECRET || 'refresh-secret',
            { expiresIn: '7d' }
        );
    }

    /**
     * Verify a Refresh Token
     */
    verifyRefreshToken(token: string): any {
        try {
            return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'refresh-secret');
        } catch (err) {
            return null;
        }
    }

    /**
     * Register a new user
     */
    async register(data: { email: string, passwordHash: string, fullName: string, phone?: string, charityPercentage: number }) {
        const charityPct = Math.max(data.charityPercentage, MINIMUM_CHARITY_PERCENTAGE);

        const result = await this.db.query(
            `INSERT INTO users (id, email, password_hash, full_name, phone, charity_percentage, auth_provider)
             VALUES ($1, $2, $3, $4, $5, $6, 'email')
             RETURNING id, email, full_name, charity_percentage, created_at`,
            [uuidv4(), data.email.toLowerCase(), data.passwordHash, data.fullName, data.phone, charityPct]
        );

        return result.rows[0];
    }

    /**
     * Find or create a user via social provider
     */
    async findOrCreateSocialUser(data: {
        email: string,
        fullName: string,
        providerId: string,
        provider: 'google' | 'apple'
    }) {
        const idField = data.provider === 'google' ? 'google_id' : 'apple_id';

        // 1. Check by Provider ID
        let result = await this.db.query(
            `SELECT id, email, full_name, charity_percentage FROM users WHERE ${idField} = $1`,
            [data.providerId]
        );

        if (result.rows.length > 0) return result.rows[0];

        // 2. Check by Email
        result = await this.db.query(
            `SELECT id, email, full_name, charity_percentage FROM users WHERE email = $1`,
            [data.email.toLowerCase()]
        );

        if (result.rows.length > 0) {
            // Link provider to existing email account
            const user = result.rows[0];
            await this.db.query(
                `UPDATE users SET ${idField} = $1, auth_provider = $2 WHERE id = $3`,
                [data.providerId, data.provider, user.id]
            );
            return user;
        }

        // 3. Create New social user
        const dummyPassword = await this.hashPassword(uuidv4()); // Random long password
        const newUser = await this.db.query(
            `INSERT INTO users (id, email, full_name, password_hash, ${idField}, auth_provider)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, email, full_name, charity_percentage`,
            [uuidv4(), data.email.toLowerCase(), data.fullName, dummyPassword, data.providerId, data.provider]
        );

        return newUser.rows[0];
    }

    /**
     * Find or create a user via phone number
     */
    async findOrCreatePhoneUser(phone: string) {
        let result = await this.db.query(
            'SELECT id, email, full_name, phone, charity_percentage FROM users WHERE phone = $1',
            [phone]
        );

        if (result.rows.length > 0) return result.rows[0];

        // Create temporary user with phone ONLY
        // In a real app, email is usually required later, but for login we can start here
        const dummyEmail = `${phone}@phone.nertamid.app`;
        const dummyPassword = await this.hashPassword(uuidv4());

        const newUser = await this.db.query(
            `INSERT INTO users (id, email, full_name, password_hash, phone, auth_provider)
             VALUES ($1, $2, $3, $4, $5, 'phone')
             RETURNING id, email, full_name, phone, charity_percentage`,
            [uuidv4(), dummyEmail, 'Usuário Telefone', dummyPassword, phone]
        );

        return newUser.rows[0];
    }
}
