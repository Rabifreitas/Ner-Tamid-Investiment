/**
 * Ner Tamid - Market Service
 * 
 * Unified provider for stock and crypto market data
 * 
 * #NerTamidEternal
 */

import ccxt from 'ccxt';
import { cacheService } from './cacheService.js';
import { createLogger, format, transports } from 'winston';
import { socketService } from './socketService.js';

const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    defaultMeta: { service: 'market-service' },
    transports: [new transports.Console()],
});

export interface MarketData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    high?: number;
    low?: number;
    volume?: number;
    source: string;
    timestamp: string;
}

export class MarketService {
    private alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;

    /**
     * Get real-time price for any symbol (Stock or Crypto)
     */
    async getQuote(symbol: string): Promise<MarketData | null> {
        const cacheKey = `quote:${symbol.toUpperCase()}`;
        const cached = await cacheService.get<MarketData>(cacheKey);
        if (cached) return cached;

        try {
            let data: MarketData | null = null;

            // Simple heuristic: if contains '/', it's likely crypto (e.g., BTC/USDT)
            // or if it's a known crypto symbol
            if (symbol.includes('/') || this.isCryptoSymbol(symbol)) {
                data = await this.getCryptoQuote(symbol);
            } else if (symbol.startsWith('AO:') || this.isBodivaSymbol(symbol)) {
                data = await this.getBodivaQuote(symbol);
            } else {
                data = await this.getStockQuote(symbol);
            }

            if (data) {
                await cacheService.set(cacheKey, data, 300); // 5 min cache
            }

            // Broadcast price if data was found
            if (data) {
                socketService.broadcastPrice(symbol, data.price);
            }

            return data;
        } catch (err) {
            logger.error(`Error fetching quote for ${symbol}:`, err);
            return null;
        }
    }

    private isBodivaSymbol(symbol: string): boolean {
        const commonBodiva = ['UNITEL', 'BAI', 'BCI', 'SONANGOL', 'ENSA'];
        return commonBodiva.includes(symbol.toUpperCase());
    }

    private isCryptoSymbol(symbol: string): boolean {
        const commonCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'];
        return commonCrypto.includes(symbol.toUpperCase());
    }

    private async getCryptoQuote(symbol: string): Promise<MarketData | null> {
        try {
            // Use Binance via CCXT for general crypto quotes
            // @ts-ignore
            const binance = new ccxt.binance();
            const ticker = await binance.fetchTicker(symbol.includes('/') ? symbol : `${symbol}/USDT`);

            return {
                symbol: ticker.symbol,
                price: ticker.last || 0,
                change: ticker.change || 0,
                changePercent: ticker.percentage || 0,
                high: ticker.high,
                low: ticker.low,
                volume: ticker.baseVolume,
                source: 'ccxt:binance',
                timestamp: new Date().toISOString(),
            };
        } catch (err) {
            logger.error(`CCXT error for ${symbol}:`, err);
            return null;
        }
    }

    private async getStockQuote(symbol: string): Promise<MarketData | null> {
        if (!this.alphaVantageKey) {
            return this.getMockStockQuote(symbol); // Fallback to mock if no key
        }

        try {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`;
            const response = await fetch(url);
            const data = (await response.json()) as any;

            if (data['Global Quote']) {
                const quote = data['Global Quote'];
                return {
                    symbol: symbol.toUpperCase(),
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                    high: parseFloat(quote['03. high']),
                    low: parseFloat(quote['04. low']),
                    volume: parseInt(quote['06. volume']),
                    source: 'alphavantage',
                    timestamp: new Date().toISOString(),
                };
            }
            return null;
        } catch (err) {
            logger.error(`AlphaVantage error for ${symbol}:`, err);
            return null;
        }
    }

    private async getBodivaQuote(symbol: string): Promise<MarketData | null> {
        // BODIVA (Angola) typically does not have a public REST API.
        // In a production environment, this would use a web scraper 
        // or a local financial data provider (e.g., LUSA, Bloomberg, or FactSet).
        logger.info(`Fetching BODIVA quote for ${symbol}`);

        // For now, we return high-fidelity simulated data based on last known values
        // for companies like BAI (Banco Angolano de Investimentos)
        const cleanSymbol = symbol.replace('AO:', '').toUpperCase();
        const basePrices: Record<string, number> = {
            'BAI': 18500,
            'BCI': 12000,
            'UNITEL': 25000,
            'ENSA': 8500
        };

        const basePrice = basePrices[cleanSymbol] || 10000;
        const volatility = 0.005; // BODIVA is usually less volatile than crypto

        return {
            symbol: `AO:${cleanSymbol}`,
            price: basePrice * (1 + (Math.random() - 0.5) * volatility),
            change: (Math.random() - 0.5) * 100,
            changePercent: (Math.random() - 0.5) * 1,
            source: 'provider:bodiva:simulated',
            timestamp: new Date().toISOString(),
        };
    }

    private getMockStockQuote(symbol: string): MarketData {
        const basePrice = Math.random() * 500 + 50;
        return {
            symbol: symbol.toUpperCase(),
            price: basePrice,
            change: (Math.random() - 0.5) * 5,
            changePercent: (Math.random() - 0.5) * 2,
            source: 'mock',
            timestamp: new Date().toISOString(),
        };
    }
}

export const marketService = new MarketService();
