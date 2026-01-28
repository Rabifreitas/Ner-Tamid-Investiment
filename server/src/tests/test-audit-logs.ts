/**
 * Ner Tamid - Audit Log Diagnostic
 * 
 * Verifies that the audit service is correctly writing to the database
 * #NerTamidEternal
 */

import { db } from '../db/client.js';
import { AuditService } from '../services/auditService.js';

async function testAudit() {
    console.log('🕎 Testing Ner Tamid Audit System...');
    const auditService = new AuditService(db);

    try {
        // Log a test action
        await auditService.log({
            action: 'diagnostic_test',
            severity: 'info',
            details: { message: 'Verificando integridade dos logs de auditoria' }
        });

        // Verify it exists in DB
        const result = await db.query('SELECT * FROM audit_logs WHERE action = $1 ORDER BY created_at DESC LIMIT 1', ['diagnostic_test']);

        if (result.rows.length > 0) {
            console.log('✅ Audit Log Verification: SUCCESS');
            console.log('   Entry ID:', result.rows[0].id);
        } else {
            console.log('❌ Audit Log Verification: FAILED (Entry not found)');
        }

        // Check for system_start logs
        const startLogs = await db.query('SELECT * FROM audit_logs WHERE action = $1', ['system_start']);
        console.log(`📊 Total System Start logs found: ${startLogs.rows.length}`);

    } catch (err) {
        console.error('❌ Audit Diagnostic Error:', err);
    } finally {
        process.exit();
    }
}

testAudit();
