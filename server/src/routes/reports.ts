/**
 * Ner Tamid - Reporting Routes
 * 
 * Endpoints for generating and downloading impact reports
 * 
 * #NerTamidEternal
 */

import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/client.js';
import { ImpactService } from '../services/impactService.js';

const router = Router();
const impactService = new ImpactService(db);

// =====================================================
// EXPORT IMPACT REPORT (PDF)
// =====================================================

router.get('/impact-pdf', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Fetch user name for the report
        const userResult = await db.query('SELECT full_name FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const userName = userResult.rows[0].full_name;
        const pdfBuffer = await impactService.generateImpactPDF(userId, userName);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Impacto_Ner_Tamid_${new Date().getFullYear()}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Falha ao gerar o relatório PDF' });
    }
});

// =====================================================
// GET IMPACT SUMMARY (JSON)
// =====================================================

router.get('/summary', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const stats = await impactService.getUserImpactStats(userId);
        res.json(stats);
    } catch (error) {
        console.error('Impact summary error:', error);
        res.status(500).json({ error: 'Erro ao obter resumo de impacto' });
    }
});

export default router;
