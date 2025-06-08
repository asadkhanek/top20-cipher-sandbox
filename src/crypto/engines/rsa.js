import * as crypto from 'crypto';
export class RSAEngine {
    constructor() {
        this.metadata = {
            id: 'rsa',
            name: 'RSA',
            category: 'asymmetric',
            variants: [
                { id: 'rsa-1024', name: 'RSA-1024', keySize: 1024 },
                { id: 'rsa-2048', name: 'RSA-2048', keySize: 2048 },
                { id: 'rsa-3072', name: 'RSA-3072', keySize: 3072 },
                { id: 'rsa-4096', name: 'RSA-4096', keySize: 4096 }
            ],
            modes: ['OAEP', 'PKCS1'],
            description: 'RSA (Rivest-Shamir-Adleman) public-key cryptosystem',
            keyRequirements: {
                minKeySize: 1024,
                maxKeySize: 4096,
                keySizes: [1024, 2048, 3072, 4096]
            },
            ivRequired: false,
            nonceRequired: false,
            securityNotes: [
                {
                    level: 'warning',
                    message: 'RSA-1024 is deprecated and should not be used for new applications'
                },
                {
                    level: 'info',
                    message: 'RSA-2048 is the current minimum recommended key size'
                }
            ],
            references: [
                {
                    title: 'RFC 8017 - PKCS #1: RSA Cryptography Specifications',
                    url: 'https://tools.ietf.org/html/rfc8017'
                }
            ],
            complexity: 'high',
            performance: 'slow'
        };
    }
    async encrypt(params) {
        try {
            const { plaintext, key, variant = 'rsa-2048' } = params;
            if (!plaintext) {
                throw new Error('Plaintext is required');
            }
            const keySize = this.getKeySizeFromVariant(variant);
            let keyPair;
            if (key) {
                // Use provided key as public key
                keyPair = { publicKey: key, privateKey: '' };
            }
            else {
                // Generate new key pair
                keyPair = this.generateKeyPair(keySize);
            }
            // Check plaintext length
            const maxLength = this.getMaxPlaintextLength(keySize);
            if (Buffer.byteLength(plaintext, 'utf8') > maxLength) {
                throw new Error(`Plaintext too long. Maximum length for ${keySize}-bit RSA is ${maxLength} bytes`);
            }
            const buffer = Buffer.from(plaintext, 'utf8');
            const encrypted = crypto.publicEncrypt({
                key: keyPair.publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            }, buffer);
            return {
                success: true,
                result: encrypted.toString('base64'),
                metadata: {
                    keyLength: keySize,
                    mode: 'OAEP',
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'RSA encryption failed'
            };
        }
    }
    async decrypt(params) {
        try {
            const { ciphertext, key, variant = 'rsa-2048' } = params;
            if (!ciphertext || !key) {
                throw new Error('Ciphertext and private key are required');
            }
            const buffer = Buffer.from(ciphertext, 'base64');
            const decrypted = crypto.privateDecrypt({
                key: key,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            }, buffer);
            return {
                success: true,
                result: decrypted.toString('utf8'),
                metadata: {
                    keyLength: this.getKeySizeFromVariant(variant),
                    mode: 'OAEP',
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'RSA decryption failed'
            };
        }
    }
    async generateKey(keySize = 2048) {
        const keyPair = this.generateKeyPair(keySize);
        return JSON.stringify({
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey
        });
    }
    generateKeyPair(keySize = 2048) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: keySize,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });
        return { publicKey, privateKey };
    }
    validateKey(key, keySize) {
        try {
            // Try to parse as JSON first (our key format)
            const parsed = JSON.parse(key);
            if (parsed.publicKey && parsed.privateKey) {
                crypto.createPublicKey(parsed.publicKey);
                crypto.createPrivateKey(parsed.privateKey);
                return true;
            }
        }
        catch {
            // Fall back to direct key validation
            try {
                crypto.createPublicKey(key);
                return true;
            }
            catch {
                try {
                    crypto.createPrivateKey(key);
                    return true;
                }
                catch {
                    return false;
                }
            }
        }
        return false;
    }
    getKeySizeFromVariant(variant) {
        const variantMap = {
            'rsa-1024': 1024,
            'rsa-2048': 2048,
            'rsa-3072': 3072,
            'rsa-4096': 4096
        };
        return variantMap[variant] || 2048;
    }
    getSupportedKeySizes() {
        return [1024, 2048, 3072, 4096];
    }
    getMaxPlaintextLength(keySize) {
        // RSA-OAEP with SHA-256: key_size/8 - 2*hash_length - 2
        return Math.floor(keySize / 8) - 2 * 32 - 2;
    }
}
