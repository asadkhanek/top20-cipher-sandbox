/**
 * SEED - Korean Block Cipher Algorithm
 *
 * SEED is a block cipher developed by South Korea's KISA and adopted as the Korean national standard.
 * This is a simplified educational implementation.
 */
import { generateRandomHex, isValidHex, validateKeyLength } from '../../lib/crypto-utils';
export class SeedEngine {
    constructor() {
        this.metadata = {
            id: 'seed',
            name: 'SEED',
            category: 'symmetric',
            variants: [
                { id: 'seed-128', name: 'SEED-128', keySize: 16 }
            ],
            modes: ['ECB', 'CBC'],
            description: 'Korean national standard block cipher algorithm',
            keyRequirements: {
                minKeySize: 16,
                maxKeySize: 16,
                keySizes: [16]
            },
            ivRequired: true,
            ivSize: 16,
            nonceRequired: false,
            securityNotes: [
                {
                    level: 'warning',
                    message: 'SEED is primarily used in Korean applications and has limited global adoption'
                }
            ],
            references: [
                {
                    title: 'SEED Specification (KISA)',
                    url: 'https://seed.kisa.or.kr/'
                }
            ],
            complexity: 'medium',
            performance: 'medium'
        };
        this.ROUNDS = 16;
        this.SS0 = new Array(256);
        this.SS1 = new Array(256);
        this.SS2 = new Array(256);
        this.SS3 = new Array(256);
        this.initializeSBoxes();
    }
    initializeSBoxes() {
        // Simplified S-boxes for educational purposes
        for (let i = 0; i < 256; i++) {
            this.SS0[i] = (i * 17 + 123) % 256;
            this.SS1[i] = (i * 31 + 89) % 256;
            this.SS2[i] = (i * 47 + 67) % 256;
            this.SS3[i] = (i * 71 + 43) % 256;
        }
    }
    f(x) {
        // Simplified F function
        const b0 = (x >>> 24) & 0xff;
        const b1 = (x >>> 16) & 0xff;
        const b2 = (x >>> 8) & 0xff;
        const b3 = x & 0xff;
        const y0 = this.SS0[b0];
        const y1 = this.SS1[b1];
        const y2 = this.SS2[b2];
        const y3 = this.SS3[b3];
        return (y0 << 24) | (y1 << 16) | (y2 << 8) | y3;
    }
    generateRoundKeys(key) {
        // Simplified key schedule
        const roundKeys = new Array(this.ROUNDS * 2);
        for (let i = 0; i < this.ROUNDS * 2; i++) {
            let rk = 0;
            for (let j = 0; j < 4; j++) {
                rk |= key[(i * 4 + j) % 16] << (24 - j * 8);
            }
            roundKeys[i] = rk;
        }
        return roundKeys;
    }
    processBlock(block, roundKeys, encrypt) {
        // Convert block to 32-bit words
        let l = (block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3];
        let r = (block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7];
        const keyOrder = encrypt ?
            Array.from({ length: this.ROUNDS }, (_, i) => i) :
            Array.from({ length: this.ROUNDS }, (_, i) => this.ROUNDS - 1 - i);
        for (const round of keyOrder) {
            const temp = r;
            r = l ^ this.f(r ^ roundKeys[round * 2]) ^ roundKeys[round * 2 + 1];
            l = temp;
        }
        // Convert back to bytes
        const result = new Uint8Array(8);
        result[0] = (l >>> 24) & 0xff;
        result[1] = (l >>> 16) & 0xff;
        result[2] = (l >>> 8) & 0xff;
        result[3] = l & 0xff;
        result[4] = (r >>> 24) & 0xff;
        result[5] = (r >>> 16) & 0xff;
        result[6] = (r >>> 8) & 0xff;
        result[7] = r & 0xff;
        return result;
    }
    async generateKey(keySize = 16) {
        return generateRandomHex(keySize);
    }
    async generateIV(ivSize = 16) {
        return generateRandomHex(ivSize);
    }
    validateKey(key, keySize = 16) {
        return isValidHex(key) && validateKeyLength(key, [keySize]);
    }
    validateIV(iv) {
        return isValidHex(iv) && iv.length === 32; // 16 bytes = 32 hex chars
    }
    async encrypt(params) {
        try {
            if (!this.validateKey(params.key)) {
                return {
                    success: false,
                    error: 'Invalid key format or length'
                };
            }
            const mode = params.mode || 'ECB';
            if (mode === 'CBC' && (!params.iv || !this.validateIV(params.iv))) {
                return {
                    success: false,
                    error: 'CBC mode requires a valid 16-byte IV'
                };
            }
            const keyBytes = new Uint8Array(params.key.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            const roundKeys = this.generateRoundKeys(keyBytes);
            const plainBytes = new TextEncoder().encode(params.plaintext);
            // Pad to block size (8 bytes)
            const paddedSize = Math.ceil(plainBytes.length / 8) * 8;
            const paddedPlain = new Uint8Array(paddedSize);
            paddedPlain.set(plainBytes);
            // PKCS#7 padding
            const padValue = paddedSize - plainBytes.length;
            for (let i = plainBytes.length; i < paddedSize; i++) {
                paddedPlain[i] = padValue;
            }
            const encrypted = new Uint8Array(paddedSize);
            let previousBlock = params.iv ?
                new Uint8Array(params.iv.match(/.{2}/g).map(byte => parseInt(byte, 16))) :
                new Uint8Array(8);
            for (let i = 0; i < paddedSize; i += 8) {
                const block = paddedPlain.slice(i, i + 8);
                if (mode === 'CBC') {
                    // XOR with previous ciphertext block (or IV)
                    for (let j = 0; j < 8; j++) {
                        block[j] ^= previousBlock[j];
                    }
                }
                const encryptedBlock = this.processBlock(block, roundKeys, true);
                encrypted.set(encryptedBlock, i);
                if (mode === 'CBC') {
                    previousBlock = encryptedBlock;
                }
            }
            const result = Array.from(encrypted)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return {
                success: true,
                result,
                metadata: {
                    keyLength: keyBytes.length,
                    ivLength: params.iv ? 16 : undefined,
                    mode
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `SEED encryption failed: ${error}`
            };
        }
    }
    async decrypt(params) {
        try {
            if (!this.validateKey(params.key)) {
                return {
                    success: false,
                    error: 'Invalid key format or length'
                };
            }
            const mode = params.mode || 'ECB';
            if (mode === 'CBC' && (!params.iv || !this.validateIV(params.iv))) {
                return {
                    success: false,
                    error: 'CBC mode requires a valid 16-byte IV'
                };
            }
            const keyBytes = new Uint8Array(params.key.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            const roundKeys = this.generateRoundKeys(keyBytes);
            const cipherBytes = new Uint8Array(params.ciphertext.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            const decrypted = new Uint8Array(cipherBytes.length);
            let previousBlock = params.iv ?
                new Uint8Array(params.iv.match(/.{2}/g).map(byte => parseInt(byte, 16))) :
                new Uint8Array(8);
            for (let i = 0; i < cipherBytes.length; i += 8) {
                const block = cipherBytes.slice(i, i + 8);
                const decryptedBlock = this.processBlock(block, roundKeys, false);
                if (mode === 'CBC') {
                    // XOR with previous ciphertext block (or IV)
                    for (let j = 0; j < 8; j++) {
                        decryptedBlock[j] ^= previousBlock[j];
                    }
                    previousBlock = block;
                }
                decrypted.set(decryptedBlock, i);
            }
            // Remove PKCS#7 padding
            const padValue = decrypted[decrypted.length - 1];
            const unpaddedLength = decrypted.length - padValue;
            const unpadded = decrypted.slice(0, unpaddedLength);
            const result = new TextDecoder().decode(unpadded);
            return {
                success: true,
                result,
                metadata: {
                    keyLength: keyBytes.length,
                    ivLength: params.iv ? 16 : undefined,
                    mode
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `SEED decryption failed: ${error}`
            };
        }
    }
}
