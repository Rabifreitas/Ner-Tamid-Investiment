/**
 * Ner Tamid - Portfolio Routes
 * 
 * Investment portfolio management with automatic charity allocation on profit
 * 
 * #NerTamidEternal
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';
import { createCharityEngine, MINIMUM_CHARITY_PERCENTAGE } from '../services/charityEngine.js';
import { createDbClient } from '../db/charityDbClient.js';
import { PortfolioService } from '../services/portfolioService.js';

const router = Router();
const charityDbClient = createDbClient(db);
const charityEngine = createCharityEngine(charityDbClient);
const portfolioService = new PortfolioService(db, charityEngine);

// Validation schemas
const addInvestmentSchema = z.object({
    symbol: z.string().min(1).max(20),
    assetName: z.string().optional(),
    assetType: z.enum(['stock', 'etf', 'crypto', 'bond', 'fund', 'other']),
    quantity: z.number().positive(),
    pricePerUnit: z.number().positive(),
});

const sellInvestmentSchema = z.object({
    quantity: z.number().positive(),
    pricePerUnit: z.number().positive(),
});

const createLimitOrderSchema = z.object({
    investmentId: z.string().uuid().optional().nullable(),
    symbol: z.string().min(1),
    orderType: z.enum(['buy', 'sell']),
    targetPrice: z.number().positive(),
    quantity: z.number().positive(),
    expiresAt: z.string().datetime().optional(),
});

// =====================================================
// GET PORTFOLIO OVERVIEW
// =====================================================

router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await db.query(`
      SELECT 
        id, symbol, asset_name, asset_type,
        quantity, average_cost, current_price,
        unrealized_profit, realized_profit, total_charity_allocated,
        first_purchase_at, last_transaction_at
      FROM investments
      WHERE user_id = $1 AND quantity > 0
      ORDER BY (quantity * COALESCE(current_price, average_cost)) DESC
    `, [userId]);

        const investments = result.rows;
        const totals = investments.reduce((acc, inv) => {
            const value = inv.quantity * (inv.current_price || inv.average_cost);
            const cost = inv.quantity * inv.average_cost;
            return {
                totalValue: acc.totalValue + value,
                totalCost: acc.totalCost + cost,
                totalUnrealized: acc.totalUnrealized + (inv.unrealized_profit || 0),
                totalRealized: acc.totalRealized + (inv.realized_profit || 0),
                totalCharity: acc.totalCharity + (inv.total_charity_allocated || 0),
            };
        }, { totalValue: 0, totalCost: 0, totalUnrealized: 0, totalRealized: 0, totalCharity: 0 });

        res.json({
            investments: investments.map(inv => ({
                id: inv.id,
                symbol: inv.symbol,
                name: inv.asset_name,
                type: inv.asset_type,
                quantity: parseFloat(inv.quantity),
                averageCost: parseFloat(inv.average_cost),
                currentPrice: inv.current_price ? parseFloat(inv.current_price) : null,
                unrealizedProfit: parseFloat(inv.unrealized_profit || 0),
                realizedProfit: parseFloat(inv.realized_profit || 0),
                charityAllocated: parseFloat(inv.total_charity_allocated || 0),
                value: parseFloat(inv.quantity) * (parseFloat(inv.current_price) || parseFloat(inv.average_cost)),
            })),
            summary: {
                totalValue: totals.totalValue,
                totalCost: totals.totalCost,
                totalUnrealizedProfit: totals.totalUnrealized,
                totalRealizedProfit: totals.totalRealized,
                totalCharityAllocated: totals.totalCharity,
                charityPercentageOfProfit: totals.totalRealized > 0
                    ? (totals.totalCharity / totals.totalRealized * 100).toFixed(2)
                    : MINIMUM_CHARITY_PERCENTAGE,
            },
        });
    } catch (error) {
        console.error('Get portfolio error:', error);
        res.status(500).json({ error: 'Failed to get portfolio' });
    }
});

// =====================================================
// ADD INVESTMENT (BUY)
// =====================================================

router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const data = addInvestmentSchema.parse(req.body);

        const result = await portfolioService.addInvestment(userId, data);

        res.status(201).json({
            message: 'Posição adicionada com sucesso! 🕎',
            investment: result
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        console.error('Add investment error:', error);
        res.status(500).json({ error: 'Falha ao adicionar investimento' });
    }
});

// =====================================================
// SELL INVESTMENT
// =====================================================

router.post('/:id/sell', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const data = sellInvestmentSchema.parse(req.body);

        const result = await portfolioService.sellInvestment(userId, id, data);

        res.json({
            message: result.isProfitable
                ? `Venda concluída! ${result.charityAllocation?.charityPercentage}% (€${result.charityAllocation?.charityAmount.toFixed(2)}) alocados para caridade! 🕎`
                : 'Venda concluída.',
            transaction: {
                id: result.transactionId,
                type: 'sell',
                profitLoss: result.profitLoss,
                isProfitable: result.isProfitable,
            },
            charity: result.charityAllocation ? {
                amount: result.charityAllocation.charityAmount,
                percentage: result.charityAllocation.charityPercentage,
                message: 'Obrigado por fazer a diferença!',
            } : null,
            remainingQuantity: result.newQuantity,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        res.status(500).json({ error: (error as any).message || 'Falha ao vender investimento' });
    }
});

// =====================================================
// LIMIT ORDERS ENDPOINTS
// =====================================================

/**
 * List user's limit orders
 */
router.get('/orders', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const result = await db.query(`
            SELECT * FROM limit_orders 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error('List orders error:', error);
        res.status(500).json({ error: 'Falha ao listar ordens' });
    }
});

/**
 * Create a new limit order
 */
router.post('/orders', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const data = createLimitOrderSchema.parse(req.body);

        const order = await portfolioService.createLimitOrder({
            userId,
            investmentId: data.investmentId || null,
            symbol: data.symbol,
            orderType: data.orderType as 'buy' | 'sell',
            targetPrice: data.targetPrice,
            quantity: data.quantity,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
        });

        res.status(201).json({
            message: 'Ordem limitada criada com sucesso! 🕎',
            order
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Falha ao criar ordem limitada' });
    }
});

/**
 * Cancel a limit order
 */
router.delete('/orders/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const result = await db.query(
            'UPDATE limit_orders SET status = \'cancelled\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND status = \'pending\' RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Ordem não encontrada ou já processada' });
            return;
        }

        res.json({ message: 'Ordem cancelada com sucesso.' });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Falha ao cancelar ordem' });
    }
});

// =====================================================
// GET TRANSACTION HISTORY
// =====================================================

router.get('/transactions', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        const result = await db.query(`
      SELECT 
        t.id, t.transaction_type, t.quantity, t.price_per_unit, 
        t.total_amount, t.profit_loss, t.is_profit_realized, t.executed_at,
        i.symbol, i.asset_name,
        ct.charity_amount, ct.charity_percentage
      FROM transactions t
      JOIN investments i ON t.investment_id = i.id
      LEFT JOIN charity_transactions ct ON t.id = ct.transaction_id
      WHERE t.user_id = $1
      ORDER BY t.executed_at DESC
      LIMIT $2
    `, [userId, limit]);

        res.json({
            transactions: result.rows.map(t => ({
                id: t.id,
                type: t.transaction_type,
                symbol: t.symbol,
                assetName: t.asset_name,
                quantity: parseFloat(t.quantity),
                pricePerUnit: parseFloat(t.price_per_unit),
                totalAmount: parseFloat(t.total_amount),
                profitLoss: t.profit_loss ? parseFloat(t.profit_loss) : null,
                charityAmount: t.charity_amount ? parseFloat(t.charity_amount) : null,
                charityPercentage: t.charity_percentage ? parseFloat(t.charity_percentage) : null,
                executedAt: t.executed_at,
            })),
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

export default router;
