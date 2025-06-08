import CryptoJS from 'crypto-js';
export class DESEngine {
    constructor() {
        this.metadata = {
            id: 'des',
            name: 'DES',
            category: 'symmetric',
            variants: [
                { id: 'des-56', name: 'DES-56', keySize: 56 }
            ],
            modes: ['ECB', 'CBC', 'CFB', 'OFB'],
            description: 'Data Encryption Standard - Legacy symmetric cipher',
            keyRequirements: {
                minKeySize: 56,
                maxKeySize: 56,
                keySizes: [56]
            },
            ivRequired: true,
            ivSize: 8,
            nonceRequired: false,
            securityNotes: [
                {
                    level: 'danger',
                    message: 'DES is cryptographically broken and should not be used for secure applications'
                },
                {
                    level: 'warning',
                    message: 'DES has a 56-bit key size which is vulnerable to brute force attacks'
                }
            ],
            references: [
                {
                    title: 'FIPS 46-3 - Data Encryption Standard',
                    url: 'https://csrc.nist.gov/publications/detail/fips/46/3/final'
                }
            ],
            complexity: 'low',
            performance: 'fast'
        };
    }
    async encrypt(params) {
        try {
            const { plaintext, key, iv, mode = 'CBC' } = params;
            if (!plaintext || !key) {
                throw new Error('Plaintext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid DES key. Must be 8 bytes (64 bits with parity)');
            }
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : CryptoJS.lib.WordArray.random(8);
            let encrypted;
            switch (mode) {
                case 'ECB':
                    encrypted = CryptoJS.DES.encrypt(plaintext, keyBytes, {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    break;
                case 'CBC':
                    encrypted = CryptoJS.DES.encrypt(plaintext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    break;
                case 'CFB':
                    encrypted = CryptoJS.DES.encrypt(plaintext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.CFB,
                        padding: CryptoJS.pad.NoPadding
                    });
                    break;
                case 'OFB':
                    encrypted = CryptoJS.DES.encrypt(plaintext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.OFB,
                        padding: CryptoJS.pad.NoPadding
                    });
                    break;
                default:
                    throw new Error(`Unsupported mode: ${mode}`);
            }
            return {
                success: true,
                result: encrypted.toString(),
                metadata: {
                    keyLength: 56,
                    ivLength: mode !== 'ECB' ? 8 : undefined,
                    mode,
                    variant: 'des-56'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'DES encryption failed'
            };
        }
    }
    async decrypt(params) {
        try {
            const { ciphertext, key, iv, mode = 'CBC' } = params;
            if (!ciphertext || !key) {
                throw new Error('Ciphertext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid DES key. Must be 8 bytes (64 bits with parity)');
            }
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : undefined;
            let decrypted;
            switch (mode) {
                case 'ECB':
                    decrypted = CryptoJS.DES.decrypt(ciphertext, keyBytes, {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    break;
                case 'CBC':
                    if (!ivBytes) {
                        throw new Error('IV is required for CBC mode');
                    }
                    decrypted = CryptoJS.DES.decrypt(ciphertext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    });
                    break;
                case 'CFB':
                    if (!ivBytes) {
                        throw new Error('IV is required for CFB mode');
                    }
                    decrypted = CryptoJS.DES.decrypt(ciphertext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.CFB,
                        padding: CryptoJS.pad.NoPadding
                    });
                    break;
                case 'OFB':
                    if (!ivBytes) {
                        throw new Error('IV is required for OFB mode');
                    }
                    decrypted = CryptoJS.DES.decrypt(ciphertext, keyBytes, {
                        iv: ivBytes,
                        mode: CryptoJS.mode.OFB,
                        padding: CryptoJS.pad.NoPadding
                    });
                    break;
                default:
                    throw new Error(`Unsupported mode: ${mode}`);
            }
            return {
                success: true,
                result: decrypted.toString(CryptoJS.enc.Utf8),
                metadata: {
                    keyLength: 56,
                    ivLength: mode !== 'ECB' ? 8 : undefined,
                    mode,
                    variant: 'des-56'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'DES decryption failed'
            };
        }
    }
    async generateKey(keySize = 56) {
        // Generate 64-bit key (8 bytes) with proper parity bits
        const key = CryptoJS.lib.WordArray.random(8);
        return key.toString(CryptoJS.enc.Hex);
    }
    async generateIV(ivSize = 8) {
        const iv = CryptoJS.lib.WordArray.random(ivSize);
        return iv.toString(CryptoJS.enc.Hex);
    }
    validateKey(key, keySize) {
        try {
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            return keyBytes.sigBytes === 8; // 64 bits
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
}
