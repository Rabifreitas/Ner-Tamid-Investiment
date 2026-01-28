/**
 * Ner Tamid - Exchange Routes
 * 
 * Manage exchange connections and account data
 * 
 * #NerTamidEternal
 */

import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/client.js';
import { ExchangeService } from '../services/exchangeService.js';
import { z } from 'zod';

const router = Router();
const exchangeService = new ExchangeService(db);

const keySchema = z.object({
    exchangeId: z.string(),
    apiKey: z.string().min(5),
    apiSecret: z.string().min(5),
    passphrase: z.string().optional(),
});

// =====================================================
// CONNECT EXCHANGE
// =====================================================

router.post('/connect', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const data = keySchema.parse(req.body);

        const connection = await exchangeService.saveExchangeKeys({
            userId,
            ...data
        });

        res.json({
            message: `Plataforma ${data.exchangeId} conectada com sucesso! 🕎`,
            connection
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        res.status(500).json({ error: 'Falha ao conectar exchange' });
    }
});

// =====================================================
// GET BALANCE
// =====================================================

router.get('/balance/:exchangeId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { exchangeId } = req.params;

        const balance = await exchangeService.getBalance(userId, exchangeId);
        res.json(balance);
    } catch (error) {
        res.status(500).json({ error: (error as any).message });
    }
});

// =====================================================
// LIST EXCHANGES
// =====================================================

router.get('/list', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const exchanges = await exchangeService.listUserExchanges(userId);
        res.json(exchanges);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar exchanges' });
    }
});

export default router;
