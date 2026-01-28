/**
 * Ner Tamid - Social & Community Routes
 * 
 * #NerTamidEternal
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';
import { SocialService } from '../services/socialService.js';
import { VotingService } from '../services/votingService.js';
import { z } from 'zod';

const router = Router();
const socialService = new SocialService(db);
const votingService = new VotingService(db);

/**
 * Get social feed
 */
router.get('/feed', async (_req: Request, res: Response) => {
    try {
        const feed = await socialService.getRecentFeed();
        res.json(feed);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar feed social' });
    }
});

/**
 * Get impact leaderboard
 */
router.get('/leaderboard', async (_req: Request, res: Response) => {
    try {
        const leaderboard = await socialService.getLeaderboard();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar ranking de impacto' });
    }
});

/**
 * Get current voting standings
 */
router.get('/voting/standings', async (_req: Request, res: Response) => {
    try {
        const standings = await votingService.getStandings();
        res.json(standings);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar votação' });
    }
});

/**
 * Cast a vote
 */
router.post('/voting/vote', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { charityId } = z.object({ charityId: z.string().uuid() }).parse(req.body);

        const result = await votingService.castVote(userId, charityId);
        res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'ID de caridade inválido' });
            return;
        }
        res.status(500).json({ error: (error as any).message || 'Falha ao registrar voto' });
    }
});

export default router;
