/**
 * Ner Tamid - Charity Routes
 * 
 * Endpoints for charity allocations, impact tracking, and organization management
 * 
 * #NerTamidEternal
 */

import { Router, type Request, type Response } from 'express';
import { db } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';
import { MINIMUM_CHARITY_PERCENTAGE } from '../services/charityEngine.js';

const router = Router();

// =====================================================
// GET USER CHARITY SUMMARY
// =====================================================

router.get('/summary', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await db.query(`
      SELECT 
        COUNT(*) as total_donations,
        COALESCE(SUM(charity_amount), 0) as total_donated,
        COALESCE(AVG(charity_percentage), 20) as avg_percentage,
        MAX(created_at) as last_donation
      FROM charity_transactions
      WHERE user_id = $1
    `, [userId]);

        const stats = result.rows[0];

        // Get top categories
        const categoriesResult = await db.query(`
      SELECT 
        impact_category as category,
        SUM(charity_amount) as amount,
        COUNT(*) as count
      FROM charity_transactions
      WHERE user_id = $1 AND impact_category IS NOT NULL
      GROUP BY impact_category
      ORDER BY amount DESC
      LIMIT 5
    `, [userId]);

        res.json({
            totalDonated: parseFloat(stats.total_donated),
            totalDonations: parseInt(stats.total_donations),
            averagePercentage: parseFloat(stats.avg_percentage),
            lastDonation: stats.last_donation,
            minimumPercentage: MINIMUM_CHARITY_PERCENTAGE,
            topCategories: categoriesResult.rows,
            message: 'Sua luz está fazendo a diferença! 🕎',
        });
    } catch (error) {
        console.error('Get charity summary error:', error);
        res.status(500).json({ error: 'Failed to get charity summary' });
    }
});

// =====================================================
// GET CHARITY TRANSACTIONS HISTORY
// =====================================================

router.get('/history', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await db.query(`
      SELECT 
        ct.id,
        ct.profit_amount,
        ct.charity_percentage,
        ct.charity_amount,
        ct.selected_by,
        ct.impact_category,
        ct.status,
        ct.blockchain_tx_hash,
        ct.created_at,
        ct.confirmed_at,
        co.name as charity_name,
        co.category as charity_category
      FROM charity_transactions ct
      LEFT JOIN charity_organizations co ON ct.charity_organization_id = co.id
      WHERE ct.user_id = $1
      ORDER BY ct.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

        res.json({
            transactions: result.rows,
            pagination: {
                limit,
                offset,
                hasMore: result.rows.length === limit,
            },
        });
    } catch (error) {
        console.error('Get charity history error:', error);
        res.status(500).json({ error: 'Failed to get charity history' });
    }
});

// =====================================================
// GET AVAILABLE CHARITY ORGANIZATIONS
// =====================================================

router.get('/organizations', async (req: Request, res: Response) => {
    try {
        const category = req.query.category as string;

        let query = `
      SELECT id, name, description, category, is_verified, 
             website, country, total_received, beneficiaries_count
      FROM charity_organizations
      WHERE is_active = TRUE
    `;
        const params: string[] = [];

        if (category) {
            query += ` AND category = $1`;
            params.push(category);
        }

        query += ` ORDER BY is_verified DESC, total_received DESC`;

        const result = await db.query(query, params);

        res.json({
            organizations: result.rows,
            categories: [
                { id: 'health', name: 'Saúde', icon: '🏥' },
                { id: 'children', name: 'Crianças', icon: '👶' },
                { id: 'education', name: 'Educação', icon: '📚' },
                { id: 'environment', name: 'Meio Ambiente', icon: '🌍' },
                { id: 'humanitarian', name: 'Humanitário', icon: '🤝' },
                { id: 'food', name: 'Alimentação', icon: '🍞' },
                { id: 'social', name: 'Social', icon: '❤️' },
            ],
        });
    } catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({ error: 'Failed to get organizations' });
    }
});

// =====================================================
// GET SINGLE CHARITY ORGANIZATION
// =====================================================

router.get('/organizations/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
      SELECT id, name, description, category, is_verified, verified_at,
             website, email, country, total_received, beneficiaries_count,
             wallet_address, created_at
      FROM charity_organizations
      WHERE id = $1 AND is_active = TRUE
    `, [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        // Get recent impact reports
        const reportsResult = await db.query(`
      SELECT id, report_period_start, report_period_end,
             total_received, total_distributed, beneficiaries_helped,
             impact_summary, is_verified
      FROM charity_impact_reports
      WHERE charity_organization_id = $1
      ORDER BY report_period_end DESC
      LIMIT 5
    `, [id]);

        res.json({
            organization: result.rows[0],
            impactReports: reportsResult.rows,
        });
    } catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({ error: 'Failed to get organization' });
    }
});

// =====================================================
// SET PREFERRED CHARITY (Protected)
// =====================================================

router.post('/preference', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { organizationId, category } = req.body;

        // Verify organization exists if specified
        if (organizationId) {
            const orgResult = await db.query(
                'SELECT id FROM charity_organizations WHERE id = $1 AND is_active = TRUE',
                [organizationId]
            );

            if (orgResult.rows.length === 0) {
                res.status(400).json({ error: 'Organization not found' });
                return;
            }
        }

        await db.query(`
      UPDATE users 
      SET preferred_charity_category = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [category || null, userId]);

        res.json({
            message: 'Charity preference updated',
            preferredCategory: category,
            preferredOrganizationId: organizationId,
        });
    } catch (error) {
        console.error('Set preference error:', error);
        res.status(500).json({ error: 'Failed to set preference' });
    }
});

// =====================================================
// GET PLATFORM CHARITY METRICS (Public)
// =====================================================

router.get('/platform-metrics', async (_req: Request, res: Response) => {
    try {
        const result = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_donors,
        COUNT(*) as total_transactions,
        COALESCE(SUM(charity_amount), 0) as total_donated,
        COALESCE(AVG(charity_percentage), 20) as avg_percentage
      FROM charity_transactions
      WHERE status IN ('allocated', 'transferred', 'confirmed')
    `);

        const metrics = result.rows[0];

        // Get monthly trend
        const trendResult = await db.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(charity_amount) as amount,
        COUNT(*) as transactions
      FROM charity_transactions
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `);

        res.json({
            totalDonated: parseFloat(metrics.total_donated),
            totalDonors: parseInt(metrics.total_donors),
            totalTransactions: parseInt(metrics.total_transactions),
            averagePercentage: parseFloat(metrics.avg_percentage),
            minimumPercentage: MINIMUM_CHARITY_PERCENTAGE,
            monthlyTrend: trendResult.rows,
            message: 'Juntos, estamos iluminando o mundo! 🕎',
        });
    } catch (error) {
        console.error('Get platform metrics error:', error);
        res.status(500).json({ error: 'Failed to get platform metrics' });
    }
});

// =====================================================
// VERIFY BLOCKCHAIN TRANSACTION
// =====================================================

router.get('/verify/:txHash', async (req: Request, res: Response) => {
    try {
        const { txHash } = req.params;

        const result = await db.query(`
      SELECT 
        ct.id,
        ct.charity_amount,
        ct.charity_percentage,
        ct.blockchain_tx_hash,
        ct.confirmed_at,
        co.name as charity_name
      FROM charity_transactions ct
      LEFT JOIN charity_organizations co ON ct.charity_organization_id = co.id
      WHERE ct.blockchain_tx_hash = $1
    `, [txHash]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        res.json({
            verified: true,
            transaction: result.rows[0],
            message: 'Esta doação foi verificada na blockchain',
        });
    } catch (error) {
        console.error('Verify transaction error:', error);
        res.status(500).json({ error: 'Failed to verify transaction' });
    }
});

export default router;
