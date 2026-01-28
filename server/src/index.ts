/**
 * Ner Tamid Eternal Insights - Main Server Entry
 * 
 * Express server with middleware configuration
 * 
 * #NerTamidEternal
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

// Load environment variables
dotenv.config();

// Import DB client
import { db } from './db/client.js';

// Import routes
import authRoutes from './routes/auth.js';
import portfolioRoutes from './routes/portfolio.js';
import charityRoutes from './routes/charity.js';
import marketRoutes from './routes/market.js';
import exchangeRoutes from './routes/exchanges.js';
import reportRoutes from './routes/reports.js';
import socialRoutes from './routes/social.js';
import discoveryRoutes from './routes/discovery.js';
import { MINIMUM_CHARITY_PERCENTAGE } from './services/charityEngine.js';
import http from 'http';
import { createCharityEngine } from './services/charityEngine.js';
import { createDbClient } from './db/charityDbClient.js';
import { PortfolioService } from './services/portfolioService.js';
import { OrderWorker } from './services/orderWorker.js';
import { AuditService } from './services/auditService.js';
import { socketService } from './services/socketService.js';
import { apiLimiter } from './middleware/rateLimit.js';

// =====================================================
// LOGGER CONFIGURATION
// =====================================================

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        process.env.LOG_FORMAT === 'pretty'
            ? format.prettyPrint()
            : format.json()
    ),
    defaultMeta: { service: 'ner-tamid-api' },
    transports: [
        new transports.Console(),
    ],
});

// =====================================================
// EXPRESS APP CONFIGURATION
// =====================================================

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Services & Workers
const charityDbClient = createDbClient(db);
const charityEngine = createCharityEngine(charityDbClient);
const portfolioService = new PortfolioService(db, charityEngine);
const auditService = new AuditService(db);
const orderWorker = new OrderWorker(portfolioService, auditService);

// Initialize Sockets
socketService.init(server);

// Start Workers
orderWorker.start();

// Log system start
auditService.log({
    action: 'system_start',
    severity: 'info',
    details: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
    }
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
app.use('/api/', apiLimiter);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
        query: req.query,
        ip: req.ip,
    });
    next();
});

// =====================================================
// API ROUTES
// =====================================================

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'Ner Tamid Eternal Insights API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        worker: {
            status: orderWorker['isRunning'] ? 'running' : 'stopped',
        },
        charity: {
            minimumPercentage: MINIMUM_CHARITY_PERCENTAGE,
            message: 'A Luz Eterna que guia investimentos com propósito',
        },
    });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/charity', charityRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/discovery', discoveryRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error:', err);

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
});

// =====================================================
// SERVER STARTUP
// =====================================================

server.listen(port, () => {
    logger.info(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🕎 NER TAMID ETERNAL INSIGHTS                          ║
  ║   "A Luz Eterna que guia investimentos com propósito"     ║
  ║                                                           ║
  ║   Server running on port ${port}                            ║
  ║   Charity minimum: ${MINIMUM_CHARITY_PERCENTAGE}% (ALWAYS)                           ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
