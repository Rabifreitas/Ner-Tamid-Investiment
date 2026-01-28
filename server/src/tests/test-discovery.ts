/**
 * Ner Tamid - Pearl Hunter First Scan Diagnostic
 * #NerTamidEternal
 */

import { discoveryService } from '../services/discoveryService.js';

async function runFirstScan() {
    console.log('💎 Iniciando Primeiro Scan Profundo "Pearl Hunter"...');

    try {
        const gems = await discoveryService.scanMarket();

        console.log(`\n✅ Scan Finalizado. Encontradas ${gems.length} pérolas com confiança > 75%:\n`);

        gems.forEach((gem, i) => {
            console.log(`${i + 1}. [${gem.symbol}] - ${gem.name}`);
            console.log(`   💎 Jewel Score: ${gem.jewelScore}%`);
            console.log(`   📊 Volume 24h: +${gem.volumeChangePct.toFixed(0)}%`);
            console.log(`   📝 Análise: ${gem.analysis}`);
            console.log(`   🛡️ Sinais: ${gem.signals.join(', ')}`);
            console.log('   -----------------------------------');
        });

    } catch (err) {
        console.error('❌ Erro no scanner:', err);
    } finally {
        process.exit();
    }
}

runFirstScan();
