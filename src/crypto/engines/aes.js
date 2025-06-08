import CryptoJS from 'crypto-js';
import { generateRandomHex, validateKeyLength, isValidHex } from '@/lib/crypto-utils';
export class AESEngine {
    constructor() {
        this.metadata = {
            id: 'aes',
            name: 'Advanced Encryption Standard (AES)',
            category: 'symmetric',
            variants: [
                { id: 'aes-128', name: 'AES-128', keySize: 16 },
                { id: 'aes-192', name: 'AES-192', keySize: 24 },
                { id: 'aes-256', name: 'AES-256', keySize: 32 }
            ],
            modes: ['ECB', 'CBC', 'CTR', 'GCM'],
            description: 'The Advanced Encryption Standard (AES) is a symmetric block cipher chosen by the U.S. government to protect classified information.',
            keyRequirements: {
                minKeySize: 16,
                maxKeySize: 32,
                keySizes: [16, 24, 32]
            },
            ivRequired: true,
            ivSize: 16,
            nonceRequired: false,
            securityNotes: [
                {
                    level: 'info',
                    message: 'AES is considered secure when used with proper modes like GCM or CBC with authentication.'
                },
                {
                    level: 'warning',
                    message: 'ECB mode should be avoided for most applications as it does not hide data patterns.'
                }
            ],
            references: [
                {
                    title: 'FIPS 197 - Advanced Encryption Standard (AES)',
                    url: 'https://csrc.nist.gov/publications/detail/fips/197/final'
                }
            ],
            complexity: 'low',
            performance: 'fast'
        };
    }
    async encrypt(params) {
        try {
            const { plaintext, key, iv, mode = 'CBC', variant = 'aes-256' } = params;
            // Validate inputs
            const keySize = this.getKeySizeFromVariant(variant);
            if (!this.validateKey(key, keySize)) {
                return {
                    success: false,
                    error: `Invalid key length. Expected ${keySize} bytes (${keySize * 2} hex characters).`
                };
            }
            if (!iv && mode !== 'ECB') {
                return {
                    success: false,
                    error: `IV is required for ${mode} mode.`
                };
            }
            if (iv && !this.validateIV(iv)) {
                return {
                    success: false,
                    error: 'Invalid IV. Must be 16 bytes (32 hex characters).'
                };
            }
            // Convert key and IV to CryptoJS format
            const keyWords = CryptoJS.enc.Hex.parse(key);
            const ivWords = iv ? CryptoJS.enc.Hex.parse(iv) : undefined;
            // Encrypt based on mode
            let encrypted;
            const options = { iv: ivWords };
            switch (mode) {
                case 'ECB':
                    options.mode = CryptoJS.mode.ECB;
                    delete options.iv;
                    break;
                case 'CBC':
                    options.mode = CryptoJS.mode.CBC;
                    break;
                case 'CTR':
                    options.mode = CryptoJS.mode.CTR;
                    break;
                case 'GCM':
                    // Note: crypto-js doesn't support GCM mode natively
                    return {
                        success: false,
                        error: 'GCM mode is not supported in this implementation. Use CBC or CTR instead.'
                    };
                default:
                    return {
                        success: false,
                        error: `Unsupported mode: ${mode}`
                    };
            }
            encrypted = CryptoJS.AES.encrypt(plaintext, keyWords, options);
            return {
                success: true,
                result: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
                metadata: {
                    keyLength: keySize,
                    ivLength: iv ? 16 : undefined,
                    mode,
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async decrypt(params) {
        try {
            const { ciphertext, key, iv, mode = 'CBC', variant = 'aes-256' } = params;
            // Validate inputs
            const keySize = this.getKeySizeFromVariant(variant);
            if (!this.validateKey(key, keySize)) {
                return {
                    success: false,
                    error: `Invalid key length. Expected ${keySize} bytes (${keySize * 2} hex characters).`
                };
            }
            if (!isValidHex(ciphertext)) {
                return {
                    success: false,
                    error: 'Invalid ciphertext format. Must be valid hexadecimal.'
                };
            }
            if (!iv && mode !== 'ECB') {
                return {
                    success: false,
                    error: `IV is required for ${mode} mode.`
                };
            }
            if (iv && !this.validateIV(iv)) {
                return {
                    success: false,
                    error: 'Invalid IV. Must be 16 bytes (32 hex characters).'
                };
            }
            // Convert key, IV, and ciphertext to CryptoJS format
            const keyWords = CryptoJS.enc.Hex.parse(key);
            const ivWords = iv ? CryptoJS.enc.Hex.parse(iv) : undefined;
            const ciphertextWords = CryptoJS.enc.Hex.parse(ciphertext);
            // Create cipher params object
            const cipherParams = CryptoJS.lib.CipherParams.create({
                ciphertext: ciphertextWords
            });
            // Decrypt based on mode
            const options = { iv: ivWords };
            switch (mode) {
                case 'ECB':
                    options.mode = CryptoJS.mode.ECB;
                    delete options.iv;
                    break;
                case 'CBC':
                    options.mode = CryptoJS.mode.CBC;
                    break;
                case 'CTR':
                    options.mode = CryptoJS.mode.CTR;
                    break;
                case 'GCM':
                    return {
                        success: false,
                        error: 'GCM mode is not supported in this implementation. Use CBC or CTR instead.'
                    };
                default:
                    return {
                        success: false,
                        error: `Unsupported mode: ${mode}`
                    };
            }
            const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWords, options);
            const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
            if (!plaintext) {
                return {
                    success: false,
                    error: 'Decryption failed. Invalid key, IV, or corrupted ciphertext.'
                };
            }
            return {
                success: true,
                result: plaintext,
                metadata: {
                    keyLength: keySize,
                    ivLength: iv ? 16 : undefined,
                    mode,
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async generateKey(keySize = 32) {
        if (!this.metadata.keyRequirements.keySizes.includes(keySize)) {
            throw new Error(`Invalid key size. Supported sizes: ${this.metadata.keyRequirements.keySizes.join(', ')} bytes`);
        }
        return generateRandomHex(keySize);
    }
    async generateIV() {
        return generateRandomHex(16);
    }
    validateKey(key, keySize = 32) {
        return validateKeyLength(key, [keySize], 'hex');
    }
    validateIV(iv) {
        return validateKeyLength(iv, [16], 'hex');
    }
    getKeySizeFromVariant(variant) {
        switch (variant) {
            case 'aes-128':
                return 16;
            case 'aes-192':
                return 24;
            case 'aes-256':
                return 32;
            default:
                return 32;
        }
    }
}
export default AESEngine;
