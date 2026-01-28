/**
 * Ner Tamid - Market Data Routes
 * 
 * Financial market data integration (Alpha Vantage / Yahoo Finance)
 * 
 * #NerTamidEternal
 */

import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { marketService } from '../services/marketService.js';

const router = Router();

// =====================================================
// GET STOCK/CRYPTO QUOTE
// =====================================================

router.get('/quote/:symbol', authMiddleware, async (req: Request, res: Response) => {
    try {
        const symbol = (req.params.symbol || '').toUpperCase();
        if (!symbol) {
            res.status(400).json({ error: 'Symbol is required' });
            return;
        }

        const quote = await marketService.getQuote(symbol);

        if (!quote) {
            res.status(404).json({ error: 'Market data not found' });
            return;
        }

        res.json(quote);
    } catch (error) {
        console.error('Get quote error:', error);
        res.status(500).json({ error: 'Failed to get quote' });
    }
});

export default router;
