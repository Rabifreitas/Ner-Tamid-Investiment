/**
 * Ner Tamid - Portfolio Service
 * 
 * Orchestrates investment lifecycle and profit-based charity allocations
 * 
 * #NerTamidEternal
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { CharityEngine } from './charityEngine.js';

export interface InvestmentPosition {
    id: string;
    symbol: string;
    assetName?: string;
    assetType: string;
    quantity: number;
    averageCost: number;
    realizedProfit: number;
    totalCharityAllocated: number;
}

export class PortfolioService {
    constructor(
        private db: Pool,
        private charityEngine: CharityEngine
    ) { }

    /**
     * Add to a position (Buy)
     */
    async addInvestment(userId: string, data: {
        symbol: string;
        assetName?: string;
        assetType: string;
        quantity: number;
        pricePerUnit: number;
    }) {
        const totalAmount = data.quantity * data.pricePerUnit;
        const client = await this.db.connect();

        try {
            await client.query('BEGIN');

            const existing = await client.query(
                'SELECT id, quantity, average_cost FROM investments WHERE user_id = $1 AND symbol = $2 FOR UPDATE',
                [userId, data.symbol.toUpperCase()]
            );

            let investmentId: string;
            let newQuantity: number;
            let newAverageCost: number;

            if (existing.rows.length > 0) {
                const current = existing.rows[0];
                const currentValue = parseFloat(current.quantity) * parseFloat(current.average_cost);
                newQuantity = parseFloat(current.quantity) + data.quantity;
                newAverageCost = (currentValue + totalAmount) / newQuantity;
                investmentId = current.id;

                await client.query(`
                    UPDATE investments 
                    SET quantity = $1, average_cost = $2, last_transaction_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `, [newQuantity, newAverageCost, investmentId]);
            } else {
                investmentId = uuidv4();
                newQuantity = data.quantity;
                newAverageCost = data.pricePerUnit;

                await client.query(`
                    INSERT INTO investments (id, user_id, symbol, asset_name, asset_type, quantity, average_cost, first_purchase_at, last_transaction_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [investmentId, userId, data.symbol.toUpperCase(), data.assetName, data.assetType, newQuantity, newAverageCost]);
            }

            await client.query(`
                INSERT INTO transactions (id, investment_id, user_id, transaction_type, quantity, price_per_unit, total_amount, executed_at)
                VALUES ($1, $2, $3, 'buy', $4, $5, $6, CURRENT_TIMESTAMP)
            `, [uuidv4(), investmentId, userId, data.quantity, data.pricePerUnit, totalAmount]);

            await client.query('COMMIT');
            return { investmentId, newQuantity, newAverageCost };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Sell a portion of a position and allocate charity
     */
    async sellInvestment(userId: string, investmentId: string, data: {
        quantity: number;
        pricePerUnit: number;
    }) {
        const client = await this.db.connect();

        try {
            await client.query('BEGIN');

            const investmentResult = await client.query(
                'SELECT * FROM investments WHERE id = $1 AND user_id = $2 FOR UPDATE',
                [investmentId, userId]
            );

            if (investmentResult.rows.length === 0) throw new Error('Posição não encontrada');

            const investment = investmentResult.rows[0];
            const currentQuantity = parseFloat(investment.quantity);

            if (data.quantity > currentQuantity) throw new Error('Quantidade insuficiente para venda');

            const sellAmount = data.quantity * data.pricePerUnit;
            const costBasis = data.quantity * parseFloat(investment.average_cost);
            const profitLoss = sellAmount - costBasis;
            const isProfitable = profitLoss > 0;

            const transactionId = uuidv4();
            await client.query(`
                INSERT INTO transactions (id, investment_id, user_id, transaction_type, quantity, price_per_unit, total_amount, profit_loss, is_profit_realized, executed_at)
                VALUES ($1, $2, $3, 'sell', $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            `, [transactionId, investmentId, userId, data.quantity, data.pricePerUnit, sellAmount, profitLoss, isProfitable]);

            const newQuantity = currentQuantity - data.quantity;
            const newRealizedProfit = parseFloat(investment.realized_profit || 0) + (isProfitable ? profitLoss : 0);

            await client.query(`
                UPDATE investments 
                SET quantity = $1, realized_profit = $2, last_transaction_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [newQuantity, newRealizedProfit, investmentId]);

            let charityAllocation = null;
            if (isProfitable) {
                const userResult = await client.query('SELECT charity_percentage, preferred_charity_category FROM users WHERE id = $1', [userId]);
                const user = userResult.rows[0];

                charityAllocation = await this.charityEngine.allocateCharity({
                    transactionId,
                    userId,
                    profitAmount: profitLoss,
                    userCharityPercentage: parseFloat(user.charity_percentage),
                    preferredCategory: user.preferred_charity_category,
                });
            }

            await client.query('COMMIT');
            return { transactionId, profitLoss, isProfitable, charityAllocation, newQuantity };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create a limit order
     */
    async createLimitOrder(params: {
        userId: string;
        investmentId: string | null;
        symbol: string;
        orderType: 'buy' | 'sell';
        targetPrice: number;
        quantity: number;
        expiresAt?: Date;
    }) {
        const id = uuidv4();
        const result = await this.db.query(`
            INSERT INTO limit_orders (id, user_id, investment_id, symbol, order_type, target_price, quantity, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [id, params.userId, params.investmentId, params.symbol.toUpperCase(), params.orderType, params.targetPrice, params.quantity, params.expiresAt]);

        return result.rows[0];
    }

    /**
     * Get all pending limit orders
     */
    async getPendingLimitOrders() {
        const result = await this.db.query(`
            SELECT * FROM limit_orders 
            WHERE status = 'pending' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        `);
        return result.rows;
    }
}
