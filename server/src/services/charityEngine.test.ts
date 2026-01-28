/**
 * Ner Tamid Eternal Insights - Charity Engine Tests
 * 
 * CRITICAL: These tests verify that the 10% charity rule
 * ALWAYS works correctly in ALL scenarios.
 * 
 * #NerTamidEternal
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    CharityEngine,
    MINIMUM_CHARITY_PERCENTAGE,
    DEFAULT_CHARITY_PERCENTAGE,
    testHelpers,
    CharityEngineError,
    type DatabaseClient,
    type BlockchainLogger,
} from './charityEngine.js';

// =====================================================
// MOCK IMPLEMENTATIONS
// =====================================================

const createMockDb = (): DatabaseClient => ({
    getCharityOrganization: vi.fn().mockResolvedValue({
        id: 'charity-1',
        name: 'Test Charity',
        category: 'health',
        isVerified: true,
        totalReceived: 0,
    }),
    getRandomCharityByCategory: vi.fn().mockResolvedValue({
        id: 'charity-2',
        name: 'Category Charity',
        category: 'education',
        isVerified: true,
        totalReceived: 0,
    }),
    getBalancedCharity: vi.fn().mockResolvedValue({
        id: 'charity-3',
        name: 'Balanced Charity',
        category: 'social',
        isVerified: true,
        totalReceived: 0,
    }),
    insertCharityTransaction: vi.fn().mockResolvedValue(undefined),
    updateCharityTransaction: vi.fn().mockResolvedValue(undefined),
    getUserCharityStats: vi.fn().mockResolvedValue({
        totalDonated: 1000,
        count: 5,
        estimatedBeneficiaries: 50,
        topCategories: [{ category: 'health', amount: 500 }],
    }),
    getRecentCharityTransactions: vi.fn().mockResolvedValue([]),
    getPlatformCharityMetrics: vi.fn().mockResolvedValue({
        totalDonated: 100000,
        totalDonors: 500,
        totalTransactions: 2000,
        averagePercentage: 22.5,
    }),
});

const createMockBlockchain = (): BlockchainLogger => ({
    recordCharityDonation: vi.fn().mockResolvedValue('0xabc123...'),
});

// =====================================================
// TEST SUITES
// =====================================================

describe('CharityEngine', () => {
    let engine: CharityEngine;
    let mockDb: DatabaseClient;
    let mockBlockchain: BlockchainLogger;

    beforeEach(() => {
        mockDb = createMockDb();
        mockBlockchain = createMockBlockchain();
        engine = new CharityEngine(mockDb, mockBlockchain);
    });

    // =================================================
    // CRITICAL: 10% Minimum Rule Tests
    // =================================================

    describe('10% Minimum Charity Rule', () => {
        it('should always allocate at least 10% of profit', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
            });

            expect(result.charityPercentage).toBeGreaterThanOrEqual(MINIMUM_CHARITY_PERCENTAGE);
            expect(result.charityAmount).toBe(100); // 10% of 1000
        });

        it('should reject attempts to set percentage below 10%', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
                userCharityPercentage: 5, // Attempting to set 5%
            });

            // Should be enforced to minimum 10%
            expect(result.charityPercentage).toBe(10);
            expect(result.charityAmount).toBe(100);
        });

        it('should reject 0% charity percentage', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
                userCharityPercentage: 0,
            });

            expect(result.charityPercentage).toBe(10);
            expect(result.charityAmount).toBe(100);
        });

        it('should reject negative charity percentage', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
                userCharityPercentage: -5,
            });

            expect(result.charityPercentage).toBe(10);
            expect(result.charityAmount).toBe(100);
        });

        it('should allow percentages above 10%', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
                userCharityPercentage: 15,
            });

            expect(result.charityPercentage).toBe(15);
            expect(result.charityAmount).toBe(150);
        });

        it('should cap percentage at 100%', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
                userCharityPercentage: 150,
            });

            expect(result.charityPercentage).toBe(100);
            expect(result.charityAmount).toBe(1000);
        });
    });

    // =================================================
    // Profit Calculation Tests
    // =================================================

    describe('Profit Calculations', () => {
        it('should calculate correct charity for small profits', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 10,
            });

            expect(result.charityAmount).toBe(1); // 10% of 10
        });

        it('should calculate correct charity for large profits', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000000,
            });

            expect(result.charityAmount).toBe(100000); // 10% of 1,000,000
        });

        it('should handle decimal profits correctly', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 123.45,
            });

            expect(result.charityAmount).toBeCloseTo(12.345, 2); // 10% of 123.45
        });

        it('should handle very small profits', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 0.01,
            });

            expect(result.charityAmount).toBeCloseTo(0.001, 4);
        });

        it('should handle zero profit gracefully', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 0,
            });

            expect(result.charityAmount).toBe(0);
        });
    });

    // =================================================
    // Charity Organization Selection Tests
    // =================================================

    describe('Charity Organization Selection', () => {
        it('should use preferred charity when specified', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
                preferredCharityId: 'charity-1',
            });

            expect(mockDb.getCharityOrganization).toHaveBeenCalledWith('charity-1');
            expect(result.selectedBy).toBe('user_choice');
        });

        it('should use category-based selection when category specified', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
                preferredCategory: 'education',
            });

            expect(mockDb.getRandomCharityByCategory).toHaveBeenCalledWith('education');
            expect(result.selectedBy).toBe('automatic');
        });

        it('should use balanced selection when no preference', async () => {
            await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
            });

            expect(mockDb.getBalancedCharity).toHaveBeenCalled();
        });
    });

    // =================================================
    // Status and Persistence Tests
    // =================================================

    describe('Allocation Persistence', () => {
        it('should save allocation to database', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
            });

            expect(mockDb.insertCharityTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: result.id,
                    transaction_id: 'tx-1',
                    user_id: 'user-1',
                    profit_amount: 1000,
                    charity_percentage: 10,
                    charity_amount: 100,
                    status: 'allocated',
                })
            );
        });

        it('should have correct initial status', async () => {
            const result = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
            });

            expect(result.status).toBe('allocated');
            expect(result.allocatedAt).toBeInstanceOf(Date);
        });
    });

    // =================================================
    // Blockchain Integration Tests
    // =================================================

    describe('Blockchain Logging', () => {
        it('should log allocation to blockchain when available', async () => {
            await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
            });

            // Wait for async blockchain call
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockBlockchain.recordCharityDonation).toHaveBeenCalled();
        });

        it('should work without blockchain logger', async () => {
            const engineNoBlockchain = new CharityEngine(mockDb);

            const result = await engineNoBlockchain.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 1000,
            });

            expect(result.charityAmount).toBe(100);
            expect(result.blockchainTxHash).toBeUndefined();
        });
    });

    // =================================================
    // Edge Cases
    // =================================================

    describe('Edge Cases', () => {
        it('should handle multiple rapid allocations', async () => {
            const promises = Array(10).fill(null).map((_, i) =>
                engine.allocateCharity({
                    transactionId: `tx-${i}`,
                    userId: 'user-1',
                    profitAmount: 100,
                })
            );

            const results = await Promise.all(promises);

            results.forEach(result => {
                expect(result.charityAmount).toBe(10);
                expect(result.charityPercentage).toBe(10);
            });
        });

        it('should generate unique IDs for each allocation', async () => {
            const result1 = await engine.allocateCharity({
                transactionId: 'tx-1',
                userId: 'user-1',
                profitAmount: 100,
            });

            const result2 = await engine.allocateCharity({
                transactionId: 'tx-2',
                userId: 'user-1',
                profitAmount: 100,
            });

            expect(result1.id).not.toBe(result2.id);
        });
    });
});

// =================================================
// Test Helper Verification
// =================================================

describe('testHelpers', () => {
    describe('verifyCharityCalculation', () => {
        it('should verify correct calculations', () => {
            expect(testHelpers.verifyCharityCalculation(1000, 100, 10)).toBe(true);
            expect(testHelpers.verifyCharityCalculation(1000, 300, 30)).toBe(true);
            expect(testHelpers.verifyCharityCalculation(500, 250, 50)).toBe(true);
        });

        it('should reject incorrect calculations', () => {
            expect(testHelpers.verifyCharityCalculation(1000, 50, 10)).toBe(false);
            expect(testHelpers.verifyCharityCalculation(1000, 100, 5)).toBe(false);
        });

        it('should reject percentages below minimum', () => {
            expect(testHelpers.verifyCharityCalculation(1000, 50, 5)).toBe(false);
            expect(testHelpers.verifyCharityCalculation(1000, 10, 1)).toBe(false);
        });

        it('should handle zero profit', () => {
            expect(testHelpers.verifyCharityCalculation(0, 0, 10)).toBe(true);
        });
    });

    it('should export correct constants', () => {
        expect(MINIMUM_CHARITY_PERCENTAGE).toBe(10);
        expect(DEFAULT_CHARITY_PERCENTAGE).toBe(10);
    });
});
