/**
 * Ner Tamid - Limit Order Diagnostic
 * 
 * Verifies the full lifecycle of a limit order: creation -> price match -> execution
 * 
 * #NerTamidEternal
 */

import { db } from '../db/client.js';
import { marketService } from '../services/marketService.js';
import { createCharityEngine } from '../services/charityEngine.js';
import { createDbClient } from '../db/charityDbClient.js';
import { PortfolioService } from '../services/portfolioService.js';
import { OrderWorker } from '../services/orderWorker.js';

async function runTest() {
    console.log('🕎 Starting Limit Order Diagnostic...');

    const charityDbClient = createDbClient(db);
    const charityEngine = createCharityEngine(charityDbClient);
    const portfolioService = new PortfolioService(db, charityEngine);
    const auditService = new (await import('../services/auditService.js')).AuditService(db);
    const orderWorker = new OrderWorker(portfolioService, auditService, 5000); // 5s check for testing

    try {
        // 1. Get or create a test user
        let userId: string;
        const userRes = await db.query('SELECT id FROM users LIMIT 1');

        if (userRes.rows.length === 0) {
            console.log('🌱 Creating seed user for testing...');
            const seedRes = await db.query(`
                INSERT INTO users (id, email, password_hash, full_name, charity_percentage)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, ['00000000-0000-0000-0000-000000000001', 'test@nertamid.com', 'hash', 'Test User', 20.00]);
            userId = seedRes.rows[0].id;
        } else {
            userId = userRes.rows[0].id;
        }

        // 2. Create a "Buy the Dip" limit order for BTC/USDT at a high price (to guarantee match)
        // We'll use a very high target price so it executes immediately
        const symbol = 'BTC/USDT';
        const quote = await marketService.getQuote(symbol);
        const currentPrice = quote?.price || 50000;
        const targetPrice = currentPrice + 1000; // Price below this target (buy)

        console.log(`📝 Creating test BUY order for ${symbol} @ target ${targetPrice} (Current: ${currentPrice})`);

        const order = await portfolioService.createLimitOrder({
            userId,
            investmentId: null,
            symbol,
            orderType: 'buy',
            targetPrice,
            quantity: 0.001,
        });

        console.log(`✅ Order created: ${order.id}. Waiting for worker to process...`);

        // 3. Manually trigger worker process
        await orderWorker.processOrders();

        // 4. Verify order status
        const checkRes = await db.query('SELECT status FROM limit_orders WHERE id = $1', [order.id]);
        const finalStatus = checkRes.rows[0].status;

        if (finalStatus === 'executed') {
            console.log('🎉 SUCCESS: Reward order was EXECUTED!');
        } else {
            console.log(`⚠️ FAILED: Order status is ${finalStatus}`);
        }

    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        await db.end();
        process.exit();
    }
}

runTest();
