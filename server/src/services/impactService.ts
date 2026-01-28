/**
 * Ner Tamid - Impact Service
 * 
 * Aggregates charitable impact data and generates reports
 * 
 * #NerTamidEternal
 */

import { Pool } from 'pg';
import PDFDocument from 'pdfkit';

export interface ImpactStats {
    totalDonated: number;
    totalDonations: number;
    averagePercentage: number;
    topCategories: Array<{ category: string, amount: number }>;
    monthlyTrend: Array<{ month: Date, amount: number }>;
}

export class ImpactService {
    constructor(private db: Pool) { }

    /**
     * Get comprehensive impact statistics for a user
     */
    async getUserImpactStats(userId: string): Promise<ImpactStats> {
        const statsResult = await this.db.query(`
            SELECT 
                COALESCE(SUM(charity_amount), 0) as total_donated,
                COUNT(*) as total_donations,
                COALESCE(AVG(charity_percentage), 0) as average_percentage
            FROM charity_transactions
            WHERE user_id = $1 AND status != 'pending'
        `, [userId]);

        const categoriesResult = await this.db.query(`
            SELECT impact_category, SUM(charity_amount) as amount
            FROM charity_transactions
            WHERE user_id = $1 AND status != 'pending'
            GROUP BY impact_category
            ORDER BY amount DESC
            LIMIT 5
        `, [userId]);

        const trendResult = await this.db.query(`
            SELECT DATE_TRUNC('month', created_at) as month, SUM(charity_amount) as amount
            FROM charity_transactions
            WHERE user_id = $1 AND status != 'pending'
            GROUP BY month
            ORDER BY month ASC
        `, [userId]);

        const stats = statsResult.rows[0];

        return {
            totalDonated: parseFloat(stats.total_donated),
            totalDonations: parseInt(stats.total_donations),
            averagePercentage: parseFloat(stats.average_percentage),
            topCategories: categoriesResult.rows.map(r => ({
                category: r.impact_category,
                amount: parseFloat(r.amount)
            })),
            monthlyTrend: trendResult.rows.map(r => ({
                month: new Date(r.month),
                amount: parseFloat(r.amount)
            })),
        };
    }

    /**
     * Generate a PDF Impact Report
     */
    async generateImpactPDF(userId: string, userName: string): Promise<Buffer> {
        const stats = await this.getUserImpactStats(userId);

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument({ margin: 50 });

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // Header
            doc.fontSize(25).text('Ner Tamid Eternal Insights', { align: 'center' });
            doc.fontSize(15).text('Relatório de Impacto Filantrópico', { align: 'center' });
            doc.moveDown();
            doc.moveTo(50, 100).lineTo(550, 100).stroke(); // Simple line
            doc.moveDown();

            // User Info
            doc.fontSize(12).text(`Doador: ${userName}`);
            doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-PT')}`);
            doc.moveDown();

            // Summary Stats
            doc.fontSize(18).text('Resumo Global', { underline: true });
            doc.fontSize(12).text(`Total Doado: €${stats.totalDonated.toFixed(2)}`);
            doc.text(`Número de Doações: ${stats.totalDonations}`);
            doc.text(`Média de Alocação: ${stats.averagePercentage.toFixed(2)}%`);
            doc.moveDown();

            // Top Categories
            if (stats.topCategories.length > 0) {
                doc.fontSize(18).text('Impacto por Categoria', { underline: true });
                stats.topCategories.forEach(cat => {
                    doc.fontSize(12).text(`${cat.category}: €${cat.amount.toFixed(2)}`);
                });
                doc.moveDown();
            }

            // Footer
            doc.fontSize(10).text('---', { align: 'center' });
            doc.text('Ner Tamid: A Luz Eterna que guia investimentos com propósito', { align: 'center', oblique: true });

            doc.end();
        });
    }
}
