/**
 * Ner Tamid - Charity Database Client
 * 
 * Database adapter for CharityEngine
 * 
 * #NerTamidEternal
 */

import type { Pool } from 'pg';
import type {
    DatabaseClient,
    CharityOrganization,
    CharityAllocation
} from '../services/charityEngine.js';

export function createDbClient(pool: Pool): DatabaseClient {
    return {
        async getCharityOrganization(id: string): Promise<CharityOrganization | null> {
            const result = await pool.query(
                `SELECT id, name, description, category, is_verified, wallet_address, total_received
         FROM charity_organizations WHERE id = $1 AND is_active = TRUE`,
                [id]
            );

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                description: row.description,
                category: row.category,
                isVerified: row.is_verified,
                walletAddress: row.wallet_address,
                totalReceived: parseFloat(row.total_received),
            };
        },

        async getRandomCharityByCategory(category: string): Promise<CharityOrganization | null> {
            const result = await pool.query(
                `SELECT id, name, description, category, is_verified, wallet_address, total_received
         FROM charity_organizations 
         WHERE category = $1 AND is_active = TRUE AND is_verified = TRUE
         ORDER BY RANDOM() LIMIT 1`,
                [category]
            );

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                description: row.description,
                category: row.category,
                isVerified: row.is_verified,
                walletAddress: row.wallet_address,
                totalReceived: parseFloat(row.total_received),
            };
        },

        async getBalancedCharity(): Promise<CharityOrganization | null> {
            // Select charity with lowest total received (balanced distribution)
            const result = await pool.query(
                `SELECT id, name, description, category, is_verified, wallet_address, total_received
         FROM charity_organizations 
         WHERE is_active = TRUE AND is_verified = TRUE
         ORDER BY total_received ASC, RANDOM() LIMIT 1`
            );

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                description: row.description,
                category: row.category,
                isVerified: row.is_verified,
                walletAddress: row.wallet_address,
                totalReceived: parseFloat(row.total_received),
            };
        },

        async insertCharityTransaction(data: Record<string, unknown>): Promise<void> {
            await pool.query(
                `INSERT INTO charity_transactions 
         (id, transaction_id, user_id, charity_organization_id, profit_amount, 
          charity_percentage, charity_amount, selected_by, impact_category, status, allocated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    data.id,
                    data.transaction_id,
                    data.user_id,
                    data.charity_organization_id,
                    data.profit_amount,
                    data.charity_percentage,
                    data.charity_amount,
                    data.selected_by,
                    data.impact_category,
                    data.status,
                    data.allocated_at,
                ]
            );

            // Update charity organization's total received
            if (data.charity_organization_id) {
                await pool.query(
                    `UPDATE charity_organizations 
           SET total_received = total_received + $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
                    [data.charity_amount, data.charity_organization_id]
                );
            }
        },

        async updateCharityTransaction(id: string, data: Record<string, unknown>): Promise<void> {
            const updates: string[] = [];
            const values: unknown[] = [];
            let paramIndex = 1;

            for (const [key, value] of Object.entries(data)) {
                updates.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }

            values.push(id);

            await pool.query(
                `UPDATE charity_transactions SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
                values
            );
        },

        async getUserCharityStats(userId: string): Promise<{
            totalDonated: number;
            count: number;
            estimatedBeneficiaries: number;
            topCategories: { category: string; amount: number }[];
        }> {
            const statsResult = await pool.query(
                `SELECT 
           COALESCE(SUM(charity_amount), 0) as total_donated,
           COUNT(*) as count
         FROM charity_transactions
         WHERE user_id = $1`,
                [userId]
            );

            const categoriesResult = await pool.query(
                `SELECT impact_category as category, SUM(charity_amount) as amount
         FROM charity_transactions
         WHERE user_id = $1 AND impact_category IS NOT NULL
         GROUP BY impact_category
         ORDER BY amount DESC
         LIMIT 5`,
                [userId]
            );

            const stats = statsResult.rows[0];

            return {
                totalDonated: parseFloat(stats.total_donated),
                count: parseInt(stats.count),
                // Estimate: €10 helps 1 beneficiary (simplified)
                estimatedBeneficiaries: Math.floor(parseFloat(stats.total_donated) / 10),
                topCategories: categoriesResult.rows.map(r => ({
                    category: r.category,
                    amount: parseFloat(r.amount),
                })),
            };
        },

        async getRecentCharityTransactions(userId: string, limit: number): Promise<CharityAllocation[]> {
            const result = await pool.query(
                `SELECT id, transaction_id, user_id, charity_organization_id,
                profit_amount, charity_percentage, charity_amount,
                selected_by, impact_category, status, blockchain_tx_hash,
                allocated_at, transferred_at, confirmed_at
         FROM charity_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
                [userId, limit]
            );

            return result.rows.map(row => ({
                id: row.id,
                transactionId: row.transaction_id,
                userId: row.user_id,
                charityOrganizationId: row.charity_organization_id,
                profitAmount: parseFloat(row.profit_amount),
                charityPercentage: parseFloat(row.charity_percentage),
                charityAmount: parseFloat(row.charity_amount),
                selectedBy: row.selected_by,
                impactCategory: row.impact_category,
                status: row.status,
                blockchainTxHash: row.blockchain_tx_hash,
                allocatedAt: row.allocated_at,
                transferredAt: row.transferred_at,
                confirmedAt: row.confirmed_at,
            }));
        },

        async getPlatformCharityMetrics(): Promise<{
            totalDonated: number;
            totalDonors: number;
            totalTransactions: number;
            averagePercentage: number;
        }> {
            const result = await pool.query(`
        SELECT 
          COALESCE(SUM(charity_amount), 0) as total_donated,
          COUNT(DISTINCT user_id) as total_donors,
          COUNT(*) as total_transactions,
          COALESCE(AVG(charity_percentage), 20) as avg_percentage
        FROM charity_transactions
      `);

            const stats = result.rows[0];

            return {
                totalDonated: parseFloat(stats.total_donated),
                totalDonors: parseInt(stats.total_donors),
                totalTransactions: parseInt(stats.total_transactions),
                averagePercentage: parseFloat(stats.avg_percentage),
            };
        },
    };
}
