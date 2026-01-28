/**
 * Ner Tamid - Authentication Routes
 * 
 * User registration, login, and session management
 * 
 * #NerTamidEternal
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { MINIMUM_CHARITY_PERCENTAGE, DEFAULT_CHARITY_PERCENTAGE } from '../services/charityEngine.js';
import { AuthService } from '../services/authService.js';

const authService = new AuthService(db);

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2).max(255),
    phone: z.string().optional(),
    charityPercentage: z.number().min(MINIMUM_CHARITY_PERCENTAGE).max(100).default(DEFAULT_CHARITY_PERCENTAGE),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// =====================================================
// REGISTER
// =====================================================

router.post('/register', authLimiter, async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check if email already exists
        const existing = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [data.email.toLowerCase()]
        );

        if (existing.rows.length > 0) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(
            data.password,
            parseInt(process.env.BCRYPT_ROUNDS || '12')
        );

        // Create user
        const user = await authService.register({
            email: data.email,
            passwordHash,
            fullName: data.fullName,
            phone: data.phone,
            charityPercentage: data.charityPercentage,
        });

        // Generate JWT
        const token = authService.generateToken({ id: user.id, email: user.email });

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                charityPercentage: user.charity_percentage,
            },
            token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// =====================================================
// LOGIN
// =====================================================

router.post('/login', authLimiter, async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const result = await db.query(
            `SELECT id, email, password_hash, full_name, charity_percentage 
       FROM users 
       WHERE email = $1 AND is_active = TRUE`,
            [data.email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(data.password, user.password_hash);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Update last login
        await db.query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generate Tokens
        const token = authService.generateToken({ id: user.id, email: user.email });
        const refreshToken = authService.generateRefreshToken({ id: user.id });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                charityPercentage: user.charity_percentage,
            },
            token,
            refreshToken,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// =====================================================
// GET CURRENT USER (Protected)
// =====================================================

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await db.query(
            `SELECT id, email, full_name, phone, charity_percentage, 
              preferred_charity_category, is_verified, created_at
       FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const user = result.rows[0];

        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            phone: user.phone,
            charityPercentage: user.charity_percentage,
            preferredCharityCategory: user.preferred_charity_category,
            isVerified: user.is_verified,
            createdAt: user.created_at,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// =====================================================
// UPDATE CHARITY PREFERENCE (Protected)
// =====================================================

router.patch('/charity-preference', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { charityPercentage, preferredCategory } = req.body;

        // ENFORCE MINIMUM
        const validPercentage = Math.max(charityPercentage || MINIMUM_CHARITY_PERCENTAGE, MINIMUM_CHARITY_PERCENTAGE);

        await db.query(
            `UPDATE users 
       SET charity_percentage = $1, 
           preferred_charity_category = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
            [validPercentage, preferredCategory, userId]
        );

        res.json({
            message: 'Charity preference updated',
            charityPercentage: validPercentage,
            preferredCategory,
        });
    } catch (error) {
        console.error('Update preference error:', error);
        res.status(500).json({ error: 'Failed to update preference' });
    }
});

// =====================================================
// REFRESH TOKEN
// =====================================================

router.post('/refresh-token', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        const decoded = authService.verifyRefreshToken(refreshToken);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
            return;
        }

        // Get user from DB to ensure they still exist and are active
        const result = await db.query(
            'SELECT id, email FROM users WHERE id = $1 AND is_active = TRUE',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ error: 'User not found or inactive' });
            return;
        }

        const user = result.rows[0];
        const newToken = authService.generateToken({ id: user.id, email: user.email });

        res.json({ token: newToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// =====================================================
// SOCIAL LOGINS (Google & Apple)
// =====================================================

const socialSchema = z.object({
    email: z.string().email(),
    fullName: z.string(),
    providerId: z.string(),
    token: z.string() // OAuth ID Token
});

router.post('/google', async (req: Request, res: Response) => {
    try {
        const data = socialSchema.parse(req.body);

        // In production: verify 'data.token' with Google libraries
        const user = await authService.findOrCreateSocialUser({
            ...data,
            provider: 'google'
        });

        const token = authService.generateToken({ id: user.id, email: user.email });
        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: 'Falha no login Google' });
    }
});

router.post('/apple', async (req: Request, res: Response) => {
    try {
        const data = socialSchema.parse(req.body);

        const user = await authService.findOrCreateSocialUser({
            ...data,
            provider: 'apple'
        });

        const token = authService.generateToken({ id: user.id, email: user.email });
        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: 'Falha no login Apple' });
    }
});

// =====================================================
// PHONE LOGIN (OTP Simulation)
// =====================================================

router.post('/phone/send-otp', async (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Telefone é obrigatório' });

    // Simulated SMS sending
    console.log(`[SMS] Enviando código 777888 para ${phone}`);
    res.json({ message: 'Código enviado com sucesso! (777888)', debug: '777888' });
});

router.post('/phone/verify-otp', async (req: Request, res: Response) => {
    const { phone, otp } = req.body;

    // Hardcoded demo check
    if (otp === '777888') {
        const user = await authService.findOrCreatePhoneUser(phone);
        const token = authService.generateToken({ id: user.id, email: user.email });
        res.json({ user, token });
    } else {
        res.status(401).json({ error: 'Código inválido' });
    }
});

export default router;
