/**
 * Ner Tamid Eternal Insights - Charity Engine
 * 
 * THE ETHICAL HEART OF THE PLATFORM
 * 
 * This module ensures that 10% (minimum) of all realized profits
 * are automatically allocated to charity. This is non-negotiable.
 * 
 * #NerTamidEternal
 */

import { v4 as uuidv4 } from 'uuid';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface CharityAllocation {
    id: string;
    transactionId: string;
    userId: string;
    profitAmount: number;
    charityPercentage: number;
    charityAmount: number;
    charityOrganizationId?: string;
    selectedBy: 'automatic' | 'user_choice' | 'community_vote';
    impactCategory?: string;
    status: CharityStatus;
    blockchainTxHash?: string;
    allocatedAt: Date;
    transferredAt?: Date;
    confirmedAt?: Date;
}

export type CharityStatus = 'pending' | 'allocated' | 'transferred' | 'confirmed' | 'failed';

export interface CharityOrganization {
    id: string;
    name: string;
    description?: string;
    category: string;
    isVerified: boolean;
    walletAddress?: string;
    totalReceived: number;
}

export interface CharityImpact {
    totalDonated: number;
    donationsCount: number;
    beneficiariesHelped: number;
    topCategories: { category: string; amount: number }[];
    recentDonations: CharityAllocation[];
}

export interface AllocateCharityParams {
    transactionId: string;
    userId: string;
    profitAmount: number;
    userCharityPercentage?: number;
    preferredCharityId?: string;
    preferredCategory?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

/**
 * THE GOLDEN RULE: NEVER LESS THAN 10%
 * This constant represents the ethical minimum that cannot be bypassed.
 */
export const MINIMUM_CHARITY_PERCENTAGE = 10;

/**
 * Default percentage if user hasn't set a preference
 */
export const DEFAULT_CHARITY_PERCENTAGE = 10;

// =====================================================
// CHARITY ENGINE CLASS
// =====================================================

export class CharityEngine {
    private db: DatabaseClient;
    private blockchain?: BlockchainLogger;

    constructor(db: DatabaseClient, blockchain?: BlockchainLogger) {
        this.db = db;
        this.blockchain = blockchain;
    }

    /**
     * CORE METHOD: Allocate charity from realized profit
     * 
     * This method MUST be called whenever profit is realized.
     * It guarantees that at least 10% goes to charity.
     * 
     * @param params - The profit and allocation parameters
     * @returns The created charity allocation record
     */
    async allocateCharity(params: AllocateCharityParams): Promise<CharityAllocation> {
        const { transactionId, userId, profitAmount, userCharityPercentage, preferredCharityId, preferredCategory } = params;

        // CRITICAL: Ensure minimum 10% - this check is non-negotiable
        const charityPercentage = this.enforceMinimumPercentage(userCharityPercentage);

        // Calculate the charity amount
        const charityAmount = this.calculateCharityAmount(profitAmount, charityPercentage);

        // Validate the calculation
        this.validateCharityAmount(profitAmount, charityAmount, charityPercentage);

        // Select charity organization
        const charityOrg = await this.selectCharityOrganization(preferredCharityId, preferredCategory);

        // Create the allocation record
        const allocation: CharityAllocation = {
            id: uuidv4(),
            transactionId,
            userId,
            profitAmount,
            charityPercentage,
            charityAmount,
            charityOrganizationId: charityOrg?.id,
            selectedBy: preferredCharityId ? 'user_choice' : 'automatic',
            impactCategory: charityOrg?.category,
            status: 'allocated',
            allocatedAt: new Date(),
        };

        // Persist to database
        await this.saveAllocation(allocation);

        // Log to blockchain for transparency (async, doesn't block)
        if (this.blockchain) {
            this.logToBlockchain(allocation).catch(err => {
                console.error('Blockchain logging failed (non-blocking):', err);
            });
        }

        // Emit event for real-time updates
        this.emitCharityEvent('charity:allocated', allocation);

        return allocation;
    }

    /**
     * CRITICAL VALIDATION: Enforce minimum 20%
     * 
     * This is the ethical safeguard. No matter what the user or system
     * tries to set, charity percentage can NEVER be below 10%.
     */
    private enforceMinimumPercentage(requestedPercentage?: number): number {
        if (requestedPercentage === undefined || requestedPercentage === null) {
            return DEFAULT_CHARITY_PERCENTAGE;
        }

        // THE GOLDEN RULE
        if (requestedPercentage < MINIMUM_CHARITY_PERCENTAGE) {
            console.warn(
                `Attempted to set charity percentage below minimum (${requestedPercentage}%). ` +
                `Enforcing minimum of ${MINIMUM_CHARITY_PERCENTAGE}%.`
            );
            return MINIMUM_CHARITY_PERCENTAGE;
        }

        // Cap at 100% (can't give more than 100%)
        if (requestedPercentage > 100) {
            return 100;
        }

        return requestedPercentage;
    }

    /**
     * Calculate charity amount from profit
     */
    private calculateCharityAmount(profitAmount: number, percentage: number): number {
        if (profitAmount <= 0) {
            return 0;
        }

        const amount = profitAmount * (percentage / 100);

        // Round to 4 decimal places for precision
        return Math.round(amount * 10000) / 10000;
    }

    /**
     * Validate that the charity amount is correct
     * This is a safety check to ensure no bugs bypass the rule
     */
    private validateCharityAmount(profit: number, charity: number, percentage: number): void {
        if (profit <= 0) {
            return; // No validation needed for non-positive profits
        }

        const expectedCharity = profit * (percentage / 100);
        const tolerance = 0.0001; // Allow for floating point precision

        if (Math.abs(charity - expectedCharity) > tolerance) {
            throw new CharityEngineError(
                'CHARITY_CALCULATION_ERROR',
                `Charity calculation mismatch. Expected ${expectedCharity}, got ${charity}`
            );
        }

        // Ensure minimum percentage is respected
        const actualPercentage = (charity / profit) * 100;
        if (actualPercentage < MINIMUM_CHARITY_PERCENTAGE - 0.01) {
            throw new CharityEngineError(
                'MINIMUM_PERCENTAGE_VIOLATION',
                `Charity percentage ${actualPercentage}% is below minimum ${MINIMUM_CHARITY_PERCENTAGE}%`
            );
        }
    }

    /**
     * Select a charity organization based on user preference or automatic selection
     */
    private async selectCharityOrganization(
        preferredId?: string,
        preferredCategory?: string
    ): Promise<CharityOrganization | null> {
        if (preferredId) {
            return this.db.getCharityOrganization(preferredId);
        }

        if (preferredCategory) {
            return this.db.getRandomCharityByCategory(preferredCategory);
        }

        // Default: select from verified charities with balanced distribution
        return this.db.getBalancedCharity();
    }

    /**
     * Save allocation to database
     */
    private async saveAllocation(allocation: CharityAllocation): Promise<void> {
        await this.db.insertCharityTransaction({
            id: allocation.id,
            transaction_id: allocation.transactionId,
            user_id: allocation.userId,
            charity_organization_id: allocation.charityOrganizationId,
            profit_amount: allocation.profitAmount,
            charity_percentage: allocation.charityPercentage,
            charity_amount: allocation.charityAmount,
            selected_by: allocation.selectedBy,
            impact_category: allocation.impactCategory,
            status: allocation.status,
            allocated_at: allocation.allocatedAt,
        });
    }

    /**
     * Log charity allocation to blockchain for transparency
     */
    private async logToBlockchain(allocation: CharityAllocation): Promise<void> {
        if (!this.blockchain) return;

        const txHash = await this.blockchain.recordCharityDonation({
            allocationId: allocation.id,
            userId: allocation.userId,
            profitAmount: allocation.profitAmount,
            charityAmount: allocation.charityAmount,
            charityOrgId: allocation.charityOrganizationId,
            timestamp: allocation.allocatedAt,
        });

        // Update allocation with blockchain hash
        await this.db.updateCharityTransaction(allocation.id, {
            blockchain_tx_hash: txHash,
            status: 'confirmed',
            confirmed_at: new Date(),
        });
    }

    /**
     * Get user's charity impact summary
     */
    async getUserImpact(userId: string): Promise<CharityImpact> {
        const stats = await this.db.getUserCharityStats(userId);
        const recent = await this.db.getRecentCharityTransactions(userId, 10);

        return {
            totalDonated: stats.totalDonated,
            donationsCount: stats.count,
            beneficiariesHelped: stats.estimatedBeneficiaries,
            topCategories: stats.topCategories,
            recentDonations: recent,
        };
    }

    /**
     * Get platform-wide charity metrics
     */
    async getPlatformMetrics(): Promise<{
        totalDonated: number;
        totalDonors: number;
        totalTransactions: number;
        averagePercentage: number;
    }> {
        return this.db.getPlatformCharityMetrics();
    }

    /**
     * Emit real-time event for charity updates
     */
    private emitCharityEvent(event: string, data: CharityAllocation): void {
        // This would integrate with WebSocket or Server-Sent Events
        // For now, just log the event
        console.log(`[CharityEngine] Event: ${event}`, {
            id: data.id,
            amount: data.charityAmount,
            percentage: data.charityPercentage,
        });
    }
}

// =====================================================
// ERROR HANDLING
// =====================================================

export class CharityEngineError extends Error {
    code: string;

    constructor(code: string, message: string) {
        super(message);
        this.name = 'CharityEngineError';
        this.code = code;
    }
}

// =====================================================
// DATABASE CLIENT INTERFACE
// =====================================================

export interface DatabaseClient {
    getCharityOrganization(id: string): Promise<CharityOrganization | null>;
    getRandomCharityByCategory(category: string): Promise<CharityOrganization | null>;
    getBalancedCharity(): Promise<CharityOrganization | null>;
    insertCharityTransaction(data: Record<string, unknown>): Promise<void>;
    updateCharityTransaction(id: string, data: Record<string, unknown>): Promise<void>;
    getUserCharityStats(userId: string): Promise<{
        totalDonated: number;
        count: number;
        estimatedBeneficiaries: number;
        topCategories: { category: string; amount: number }[];
    }>;
    getRecentCharityTransactions(userId: string, limit: number): Promise<CharityAllocation[]>;
    getPlatformCharityMetrics(): Promise<{
        totalDonated: number;
        totalDonors: number;
        totalTransactions: number;
        averagePercentage: number;
    }>;
}

// =====================================================
// BLOCKCHAIN LOGGER INTERFACE
// =====================================================

export interface BlockchainLogger {
    recordCharityDonation(data: {
        allocationId: string;
        userId: string;
        profitAmount: number;
        charityAmount: number;
        charityOrgId?: string;
        timestamp: Date;
    }): Promise<string>; // Returns transaction hash
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export function createCharityEngine(
    db: DatabaseClient,
    blockchain?: BlockchainLogger
): CharityEngine {
    return new CharityEngine(db, blockchain);
}

// =====================================================
// UNIT TEST HELPERS (for vitest)
// =====================================================

export const testHelpers = {
    MINIMUM_CHARITY_PERCENTAGE,
    DEFAULT_CHARITY_PERCENTAGE,

    /**
     * Verify that a charity calculation is correct
     */
    verifyCharityCalculation(profit: number, charity: number, percentage: number): boolean {
        if (profit <= 0) return charity === 0;
        if (percentage < MINIMUM_CHARITY_PERCENTAGE) return false;

        const expected = profit * (percentage / 100);
        return Math.abs(charity - expected) < 0.0001;
    },
};
