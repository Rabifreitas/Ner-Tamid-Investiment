/**
 * Ner Tamid - Rate Limiting Middleware
 * 
 * Prevents API abuse and brute force attacks
 * 
 * #NerTamidEternal
 */

import { type Request, type Response, type NextFunction } from 'express';
import { cacheService } from '../services/cacheService.js';

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message: string;
}

export const rateLimit = (options: RateLimitOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.get('x-forwarded-for') || 'unknown';
        const key = `ratelimit:${req.path}:${ip}`;

        try {
            const current = await cacheService.get<number>(key) || 0;

            if (current >= options.max) {
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: options.message,
                });
                return;
            }

            // Increment and set TTL if new
            await cacheService.set(key, current + 1, Math.floor(options.windowMs / 1000));

            next();
        } catch (err) {
            // Fallback: if Redis fails, let the request through but log error
            console.error('Rate limit error:', err);
            next();
        }
    };
};

/**
 * Common Rate Limit Profiles
 */

// General API protection
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Auth protection (stricter)
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many login attempts, please try again after an hour',
});
