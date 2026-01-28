/**
 * Ner Tamid - Authentication Middleware
 * 
 * JWT verification for protected routes
 * 
 * #NerTamidEternal
 */

import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
    email: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'dev-secret';

        const decoded = jwt.verify(token, secret) as JwtPayload;

        // Attach user info to request
        (req as any).userId = decoded.userId;
        (req as any).userEmail = decoded.email;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        res.status(500).json({ error: 'Authentication failed' });
    }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'dev-secret';
            const decoded = jwt.verify(token, secret) as JwtPayload;
            (req as any).userId = decoded.userId;
            (req as any).userEmail = decoded.email;
        }

        next();
    } catch {
        // Continue without authentication
        next();
    }
}
