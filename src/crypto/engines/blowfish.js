import CryptoJS from 'crypto-js';
export class BlowfishEngine {
    constructor() {
        this.metadata = {
            id: 'blowfish',
            name: 'Blowfish',
            category: 'symmetric',
            variants: [
                { id: 'blowfish-64', name: 'Blowfish-64', keySize: 64 },
                { id: 'blowfish-128', name: 'Blowfish-128', keySize: 128 },
                { id: 'blowfish-256', name: 'Blowfish-256', keySize: 256 },
                { id: 'blowfish-448', name: 'Blowfish-448', keySize: 448 }
            ],
            modes: ['ECB', 'CBC', 'CFB', 'OFB'],
            description: 'Blowfish symmetric block cipher designed by Bruce Schneier',
            keyRequirements: {
                minKeySize: 32,
                maxKeySize: 448,
                keySizes: [64, 128, 256, 448]
            },
            ivRequired: true,
            ivSize: 8,
            nonceRequired: false,
            securityNotes: [
                {
                    level: 'warning',
                    message: 'Blowfish has a 64-bit block size which may be vulnerable to birthday attacks'
                },
                {
                    level: 'info',
                    message: 'Blowfish is suitable for applications where key changes are infrequent'
                }
            ],
            references: [
                {
                    title: 'Blowfish Encryption Algorithm',
                    url: 'https://www.schneier.com/academic/blowfish/'
                }
            ],
            complexity: 'medium',
            performance: 'fast'
        };
    }
    async encrypt(params) {
        try {
            const { plaintext, key, iv, mode = 'CBC', variant = 'blowfish-128' } = params;
            if (!plaintext || !key) {
                throw new Error('Plaintext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid Blowfish key. Must be between 4 and 56 bytes');
            }
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : CryptoJS.lib.WordArray.random(8);
            let encrypted;
            switch (mode) {
                case 'ECB':
                    encrypted = CryptoJS.Blowfish.encrypt(plaintext, keyBytes, {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    break;
                case 'CBC':
                    encrypted = CryptoJS.Blowfish.encrypt(plaintext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    break;
                case 'CFB':
                    encrypted = CryptoJS.Blowfish.encrypt(plaintext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.CFB,
                        padding: CryptoJS.pad.NoPadding
                    });
                    break;
                case 'OFB':
                    encrypted = CryptoJS.Blowfish.encrypt(plaintext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.OFB,
                        padding: CryptoJS.pad.NoPadding
                    });
                    break;
                default:
                    throw new Error(`Unsupported mode: ${mode}`);
            }
            const keyLength = this.getKeyLengthFromVariant(variant);
            return {
                success: true,
                result: encrypted.toString(),
                metadata: {
                    keyLength,
                    ivLength: mode !== 'ECB' ? 8 : undefined,
                    mode,
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Blowfish encryption failed'
            };
        }
    }
    async decrypt(params) {
        try {
            const { ciphertext, key, iv, mode = 'CBC', variant = 'blowfish-128' } = params;
            if (!ciphertext || !key) {
                throw new Error('Ciphertext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid Blowfish key. Must be between 4 and 56 bytes');
            }
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : undefined;
            let decrypted;
            switch (mode) {
                case 'ECB':
                    decrypted = CryptoJS.Blowfish.decrypt(ciphertext, keyBytes, {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    break;
                case 'CBC':
                    if (!ivBytes) {
                        throw new Error('IV is required for CBC mode');
                    }
                    decrypted = CryptoJS.Blowfish.decrypt(ciphertext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    break;
                case 'CFB':
                    if (!ivBytes) {
                        throw new Error('IV is required for CFB mode');
                    }
                    decrypted = CryptoJS.Blowfish.decrypt(ciphertext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.CFB,
                        padding: CryptoJS.pad.NoPadding
                    });
                    break;
                case 'OFB':
                    if (!ivBytes) {
                        throw new Error('IV is required for OFB mode');
                    }
                    decrypted = CryptoJS.Blowfish.decrypt(ciphertext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.OFB,
                        padding: CryptoJS.pad.NoPadding
                    });
                    break;
                default:
                    throw new Error(`Unsupported mode: ${mode}`);
            }
            const keyLength = this.getKeyLengthFromVariant(variant);
            return {
                success: true,
                result: decrypted.toString(CryptoJS.enc.Utf8),
                metadata: {
                    keyLength,
                    ivLength: mode !== 'ECB' ? 8 : undefined,
                    mode,
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Blowfish decryption failed'
            };
        }
    }
    async generateKey(keySize = 128) {
        // Convert bits to bytes
        const keyBytes = Math.ceil(keySize / 8);
        const key = CryptoJS.lib.WordArray.random(keyBytes);
        return key.toString(CryptoJS.enc.Hex);
    }
    async generateIV(ivSize = 8) {
        const iv = CryptoJS.lib.WordArray.random(ivSize);
        return iv.toString(CryptoJS.enc.Hex);
    }
    validateKey(key, keySize) {
        try {
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            // Blowfish accepts keys from 32 bits (4 bytes) to 448 bits (56 bytes)
            return keyBytes.sigBytes >= 4 && keyBytes.sigBytes <= 56;
        }
        catch {
            return false;
        }
    }
    validateIV(iv) {
        try {
            const ivBytes = CryptoJS.enc.Hex.parse(iv);
            return ivBytes.sigBytes === 8; // 64 bits
        }
        catch {
            return false;
        }
    }
    getKeyLengthFromVariant(variant) {
        const variantMap = {
            'blowfish-64': 64,
            'blowfish-128': 128,
            'blowfish-256': 256,
            'blowfish-448': 448
        };
        return variantMap[variant] || 128;
    }
}
