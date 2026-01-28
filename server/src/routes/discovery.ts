/**
 * Ner Tamid - Discovery Routes
 * 
 * Endpoints for the Pearl Hunter AI system
 * #NerTamidEternal
 */

import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { discoveryService } from '../services/discoveryService.js';

const router = Router();

// =====================================================
// GET MARKET GEMS
// =====================================================

router.get('/gems', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const gems = await discoveryService.getGems();
        res.json({
            count: gems.length,
            gems: gems
        });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar pérolas do mercado' });
    }
});

// =====================================================
// TRIGGER RE-SCAN
// =====================================================

router.post('/scan', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const gems = await discoveryService.scanMarket();
        res.json({
            message: 'Scan profundo concluído com sucesso 💎',
            count: gems.length,
            gems: gems
        });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao executar scan profundo' });
    }
});

export default router;
