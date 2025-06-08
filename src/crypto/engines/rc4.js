import CryptoJS from 'crypto-js';
export class RC4Engine {
    constructor() {
        this.metadata = {
            id: 'rc4',
            name: 'RC4',
            category: 'symmetric',
            variants: [
                { id: 'rc4-40', name: 'RC4-40', keySize: 40 },
                { id: 'rc4-64', name: 'RC4-64', keySize: 64 },
                { id: 'rc4-128', name: 'RC4-128', keySize: 128 },
                { id: 'rc4-256', name: 'RC4-256', keySize: 256 }
            ],
            modes: ['Stream'],
            description: 'RC4 stream cipher - Rivest Cipher 4',
            keyRequirements: {
                minKeySize: 40,
                maxKeySize: 2048,
                keySizes: [40, 64, 128, 256]
            },
            ivRequired: false,
            nonceRequired: false,
            securityNotes: [
                {
                    level: 'danger',
                    message: 'RC4 is cryptographically broken and should not be used for secure applications'
                },
                {
                    level: 'warning',
                    message: 'RC4 has known biases and vulnerabilities, including key collisions'
                },
                {
                    level: 'info',
                    message: 'RC4 was widely used in SSL/TLS and WEP but is now deprecated'
                }
            ],
            references: [
                {
                    title: 'RFC 7465 - Prohibiting RC4 Cipher Suites',
                    url: 'https://tools.ietf.org/html/rfc7465'
                }
            ],
            complexity: 'low',
            performance: 'fast'
        };
    }
    async encrypt(params) {
        try {
            const { plaintext, key, variant = 'rc4-128' } = params;
            if (!plaintext || !key) {
                throw new Error('Plaintext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid RC4 key. Must be between 5 and 256 bytes');
            }
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const encrypted = CryptoJS.RC4.encrypt(plaintext, keyBytes);
            const keyLength = this.getKeyLengthFromVariant(variant);
            return {
                success: true,
                result: encrypted.toString(),
                metadata: {
                    keyLength,
                    mode: 'Stream',
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'RC4 encryption failed'
            };
        }
    }
    async decrypt(params) {
        try {
            const { ciphertext, key, variant = 'rc4-128' } = params;
            if (!ciphertext || !key) {
                throw new Error('Ciphertext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid RC4 key. Must be between 5 and 256 bytes');
            }
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const decrypted = CryptoJS.RC4.decrypt(ciphertext, keyBytes);
            const keyLength = this.getKeyLengthFromVariant(variant);
            return {
                success: true,
                result: decrypted.toString(CryptoJS.enc.Utf8),
                metadata: {
                    keyLength,
                    mode: 'Stream',
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'RC4 decryption failed'
            };
        }
    }
    async generateKey(keySize = 128) {
        // Convert bits to bytes
        const keyBytes = Math.ceil(keySize / 8);
        const key = CryptoJS.lib.WordArray.random(keyBytes);
        return key.toString(CryptoJS.enc.Hex);
    }
    validateKey(key, keySize) {
        try {
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            // RC4 accepts keys from 40 bits (5 bytes) to 2048 bits (256 bytes)
            return keyBytes.sigBytes >= 5 && keyBytes.sigBytes <= 256;
        }
        catch {
            return false;
        }
    }
    getKeyLengthFromVariant(variant) {
        const variantMap = {
            'rc4-40': 40,
            'rc4-64': 64,
            'rc4-128': 128,
            'rc4-256': 256
        };
        return variantMap[variant] || 128;
    }
}
