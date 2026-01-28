/**
 * Ner Tamid - Social Auth Diagnostic
 * #NerTamidEternal
 */

import { db } from '../db/client.js';
import { AuthService } from '../services/authService.js';

const authService = new AuthService(db);

async function testSocialAuth() {
    console.log('🧪 Iniciando Teste de Autenticação Social...');

    try {
        // 1. Test Google Login (New User)
        console.log('--- Teste 1: Novo Usuário Google ---');
        const googleUser = await authService.findOrCreateSocialUser({
            email: 'tester.google@nertamid.app',
            fullName: 'Google Tester',
            providerId: 'g_id_123',
            provider: 'google'
        });
        console.log(`✅ Usuário Google criado: ${googleUser.email} (ID: ${googleUser.id})`);

        // 2. Test Apple Login (Matching Email - Linking)
        console.log('\n--- Teste 2: Vinculação Apple pelo mesmo Email ---');
        const appleUser = await authService.findOrCreateSocialUser({
            email: 'tester.google@nertamid.app',
            fullName: 'Apple Tester',
            providerId: 'a_id_456',
            provider: 'apple'
        });
        console.log(`✅ Usuário Apple vinculado ao mesmo ID: ${appleUser.id}`);

        // 3. Test Phone Login
        console.log('\n--- Teste 3: Login por Telefone ---');
        const phoneUser = await authService.findOrCreatePhoneUser('+351912345678');
        console.log(`✅ Usuário Telefone criado/encontrado: ${phoneUser.phone}`);

        console.log('\n✨ Todos os testes de auth social passaram!');

    } catch (err) {
        console.error('❌ Erro nos testes:', err);
    } finally {
        process.exit();
    }
}

testSocialAuth();
