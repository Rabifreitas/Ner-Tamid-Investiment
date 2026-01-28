/**
 * Ner Tamid - Cache Service
 * 
 * Generic Redis-based caching service for performance optimization
 * 
 * #NerTamidEternal
 */

import Redis from 'ioredis';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    defaultMeta: { service: 'cache-service' },
    transports: [new transports.Console()],
});

export class CacheService {
    private redis: any | null = null;
    private isConnected = false;

    constructor() {
        if (process.env.REDIS_URL || process.env.REDIS_HOST) {
            try {
                const redisConfig = process.env.REDIS_URL || {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                };

                // @ts-ignore - resolve ESM constructor issue
                const RedisClient = (Redis.default || Redis) as any;
                this.redis = new RedisClient(redisConfig);

                this.redis!.on('connect', () => {
                    this.isConnected = true;
                    logger.info('Connected to Redis');
                });

                this.redis.on('error', (err: any) => {
                    this.isConnected = false;
                    logger.error('Redis connection error:', err);
                });
            } catch (err) {
                logger.error('Failed to initialize Redis client:', err);
            }
        } else {
            logger.warn('Redis configuration missing. Caching will be disabled.');
        }
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.redis) return null;

        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (err) {
            logger.error(`Error getting key ${key} from Redis:`, err);
            return null;
        }
    }

    /**
     * Set a value in cache with TTL
     */
    async set(key: string, value: any, ttlSeconds = 3600): Promise<boolean> {
        if (!this.isConnected || !this.redis) return false;

        try {
            const stringValue = JSON.stringify(value);
            await this.redis.set(key, stringValue, 'EX', ttlSeconds);
            return true;
        } catch (err) {
            logger.error(`Error setting key ${key} in Redis:`, err);
            return false;
        }
    }

    /**
     * Delete a value from cache
     */
    async del(key: string): Promise<boolean> {
        if (!this.isConnected || !this.redis) return false;

        try {
            await this.redis.del(key);
            return true;
        } catch (err) {
            logger.error(`Error deleting key ${key} from Redis:`, err);
            return false;
        }
    }

    /**
     * Clear keys by pattern
     */
    async clearPattern(pattern: string): Promise<void> {
        if (!this.isConnected || !this.redis) return;

        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (err) {
            logger.error(`Error clearing pattern ${pattern} from Redis:`, err);
        }
    }
}

// Export singleton instance
export const cacheService = new CacheService();
