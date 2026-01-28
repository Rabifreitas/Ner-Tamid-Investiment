/**
 * Ner Tamid - Order Worker
 * 
 * Background process to monitor and execute limit orders
 * 
 * #NerTamidEternal
 */

import { marketService } from './marketService.js';
import { PortfolioService } from './portfolioService.js';
import { socketService } from './socketService.js';
import { AuditService } from './auditService.js';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    defaultMeta: { service: 'order-worker' },
    transports: [new transports.Console()],
});

export class OrderWorker {
    private isRunning = false;
    private interval: NodeJS.Timeout | null = null;

    constructor(
        private portfolioService: PortfolioService,
        private auditService: AuditService,
        private checkIntervalMs: number = 60000 // Default 1 minute
    ) { }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        logger.info(`Order Worker started (Interval: ${this.checkIntervalMs}ms)`);

        this.interval = setInterval(() => this.processOrders(), this.checkIntervalMs);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        this.isRunning = false;
        logger.info('Order Worker stopped');
    }

    async processOrders() {
        try {
            const pendingOrders = await this.portfolioService.getPendingLimitOrders();
            if (pendingOrders.length === 0) return;

            logger.info(`Processing ${pendingOrders.length} pending limit orders...`);

            for (const order of pendingOrders) {
                await this.checkAndExecuteOrder(order);
            }
        } catch (err) {
            logger.error('Error in processOrders:', err);
        }
    }

    private async checkAndExecuteOrder(order: any) {
        try {
            const quote = await marketService.getQuote(order.symbol);
            if (!quote) return;

            const currentPrice = quote.price;
            const targetPrice = parseFloat(order.target_price);
            let shouldExecute = false;

            if (order.order_type === 'sell') {
                // Sell when price is AT OR ABOVE target (Take Profit)
                shouldExecute = currentPrice >= targetPrice;
            } else if (order.order_type === 'buy') {
                // Buy when price is AT OR BELOW target (Buy the Dip)
                shouldExecute = currentPrice <= targetPrice;
            }

            if (shouldExecute) {
                logger.info(`🚀 Executing ${order.order_type} order for ${order.symbol} at ${currentPrice} (Target: ${targetPrice})`);

                if (order.order_type === 'sell') {
                    await this.portfolioService.sellInvestment(order.user_id, order.investment_id, {
                        quantity: parseFloat(order.quantity),
                        pricePerUnit: currentPrice
                    });
                } else {
                    await this.portfolioService.addInvestment(order.user_id, {
                        symbol: order.symbol,
                        assetType: 'other', // Should ideally be retrieved from order or position
                        quantity: parseFloat(order.quantity),
                        pricePerUnit: currentPrice
                    });
                }

                // Notify user via Socket
                socketService.notifyOrderExecuted(order.user_id, {
                    orderId: order.id,
                    symbol: order.symbol,
                    type: order.order_type,
                    executedPrice: currentPrice,
                    quantity: order.quantity
                });

                // Record in Audit Log
                await this.auditService.log({
                    userId: order.user_id,
                    action: 'order_execution',
                    resourceType: 'limit_order',
                    resourceId: order.id,
                    severity: 'info',
                    details: {
                        symbol: order.symbol,
                        type: order.order_type,
                        executedPrice: currentPrice,
                        quantity: order.quantity,
                        timestamp: new Date()
                    }
                });

                // Mark order as executed
                // Note: In production, this should be done INSIDE the transaction in PortfolioService
                // For now, updating status separately
                await this.portfolioService['db'].query(
                    'UPDATE limit_orders SET status = \'executed\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [order.id]
                );
            }
        } catch (err) {
            logger.error(`Failed to execute order ${order.id}:`, err);

            // Record failure in Audit Log
            await this.auditService.log({
                userId: order.user_id,
                action: 'order_execution_failed',
                resourceType: 'limit_order',
                resourceId: order.id,
                severity: 'error',
                details: {
                    error: (err as any).message,
                    symbol: order.symbol,
                    type: order.order_type
                }
            });

            await this.portfolioService['db'].query(
                'UPDATE limit_orders SET status = \'failed\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [order.id]
            );
        }
    }
}
