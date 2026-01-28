/**
 * Ner Tamid - Encryption Utility
 * 
 * Secure encryption/decryption for sensitive data (API Keys, etc.)
 * Uses AES-256-GCM
 * 
 * #NerTamidEternal
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'ner-tamid-default-master-key', 'salt', 32);

/**
 * Encrypt a string
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string
 */
export function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}
