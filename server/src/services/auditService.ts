/**
 * Ner Tamid - Audit Service
 * 
 * Centralized logging for security and compliance
 * #NerTamidEternal
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, format, transports } from 'winston';

const winstonLogger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    defaultMeta: { service: 'audit-service' },
    transports: [new transports.Console()],
});

export class AuditService {
    constructor(private db: Pool) { }

    /**
     * Log a system or user action
     */
    async log(params: {
        userId?: string;
        action: string;
        resourceType?: string;
        resourceId?: string;
        details?: any;
        severity?: 'info' | 'warning' | 'error' | 'critical';
        ipAddress?: string;
    }) {
        const id = uuidv4();
        try {
            await this.db.query(`
                INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, severity, ip_address)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                id,
                params.userId,
                params.action,
                params.resourceType,
                params.resourceId,
                JSON.stringify(params.details || {}),
                params.severity || 'info',
                params.ipAddress
            ]);

            winstonLogger.info('Audit Log Entry Created', { action: params.action, id });
        } catch (err) {
            winstonLogger.error('Failed to write audit log', { error: (err as any).message, params });
            // In a production environment, you might want to alert here as audit logs are critical
        }
    }
}
