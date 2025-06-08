import CryptoJS from 'crypto-js';
export class XteaEngine {
    constructor() {
        this.metadata = {
            id: 'xtea',
            name: 'XTEA',
            category: 'symmetric',
            variants: [
                { id: 'xtea', name: 'XTEA', keySize: 128 }
            ],
            modes: ['ECB', 'CBC'],
            description: 'Extended Tiny Encryption Algorithm - improved version of TEA',
            keyRequirements: {
                minKeySize: 128,
                maxKeySize: 128,
                keySizes: [128]
            },
            ivRequired: true,
            ivSize: 8,
            nonceRequired: false,
            securityNotes: [
                {
                    level: 'info',
                    message: 'XTEA fixes the known weaknesses in original TEA'
                },
                {
                    level: 'warning',
                    message: '64-bit block size makes it vulnerable to birthday attacks'
                },
                {
                    level: 'info',
                    message: 'Suitable for embedded systems and educational use'
                }
            ],
            references: [
                {
                    title: 'Extended Tiny Encryption Algorithm',
                    url: 'https://en.wikipedia.org/wiki/XTEA'
                }
            ],
            complexity: 'low',
            performance: 'fast'
        };
        this.XTEA_ROUNDS = 32;
        this.XTEA_DELTA = 0x9e3779b9;
        this.BLOCK_SIZE = 8; // 64 bits
    }
    async encrypt(params) {
        try {
            const { plaintext, key, iv, mode = 'CBC', variant = 'xtea' } = params;
            if (!plaintext || !key) {
                throw new Error('Plaintext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid XTEA key. Must be exactly 16 bytes (128 bits)');
            }
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : CryptoJS.lib.WordArray.random(8);
            const plaintextBytes = CryptoJS.enc.Utf8.parse(plaintext);
            let encrypted;
            if (mode === 'ECB') {
                encrypted = this.encryptECB(plaintextBytes, keyBytes);
            }
            else if (mode === 'CBC') {
                encrypted = this.encryptCBC(plaintextBytes, keyBytes, ivBytes);
            }
            else {
                throw new Error(`Mode ${mode} not implemented for XTEA`);
            }
            return {
                success: true,
                result: encrypted,
                metadata: {
                    keyLength: 128,
                    ivLength: mode !== 'ECB' ? 8 : undefined,
                    mode,
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'XTEA encryption failed'
            };
        }
    }
    async decrypt(params) {
        try {
            const { ciphertext, key, iv, mode = 'CBC', variant = 'xtea' } = params;
            if (!ciphertext || !key) {
                throw new Error('Ciphertext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid XTEA key. Must be exactly 16 bytes (128 bits)');
            }
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : undefined;
            const ciphertextBytes = CryptoJS.enc.Hex.parse(ciphertext);
            let decrypted;
            if (mode === 'ECB') {
                decrypted = this.decryptECB(ciphertextBytes, keyBytes);
            }
            else if (mode === 'CBC') {
                if (!ivBytes) {
                    throw new Error('IV is required for CBC mode');
                }
                decrypted = this.decryptCBC(ciphertextBytes, keyBytes, ivBytes);
            }
            else {
                throw new Error(`Mode ${mode} not implemented for XTEA`);
            }
            return {
                success: true,
                result: decrypted.toString(CryptoJS.enc.Utf8),
                metadata: {
                    keyLength: 128,
                    ivLength: mode !== 'ECB' ? 8 : undefined,
                    mode,
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'XTEA decryption failed'
            };
        }
    }
    async generateKey(keySize = 128) {
        const key = CryptoJS.lib.WordArray.random(16);
        return key.toString(CryptoJS.enc.Hex);
    }
    async generateIV(ivSize = 8) {
        const iv = CryptoJS.lib.WordArray.random(ivSize);
        return iv.toString(CryptoJS.enc.Hex);
    }
    validateKey(key, keySize) {
        try {
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            return keyBytes.sigBytes === 16;
        }
        catch {
            return false;
        }
    }
    validateIV(iv) {
        try {
            const ivBytes = CryptoJS.enc.Hex.parse(iv);
            return ivBytes.sigBytes === 8;
        }
        catch {
            return false;
        }
    }
    encryptECB(plaintext, key) {
        const result = this.processBlocks(plaintext, key, true);
        return result.toString(CryptoJS.enc.Hex);
    }
    decryptECB(ciphertext, key) {
        return this.processBlocks(ciphertext, key, false);
    }
    encryptCBC(plaintext, key, iv) {
        const blocks = this.splitIntoBlocks(plaintext, 8);
        let previousBlock = iv;
        const encryptedBlocks = [];
        for (const block of blocks) {
            const xored = this.xorBlocks(block, previousBlock);
            const encrypted = this.encryptBlock(xored, key);
            encryptedBlocks.push(encrypted);
            previousBlock = encrypted;
        }
        return this.concatBlocks(encryptedBlocks).toString(CryptoJS.enc.Hex);
    }
    decryptCBC(ciphertext, key, iv) {
        const blocks = this.splitIntoBlocks(ciphertext, 8);
        let previousBlock = iv;
        const decryptedBlocks = [];
        for (const block of blocks) {
            const decrypted = this.decryptBlock(block, key);
            const xored = this.xorBlocks(decrypted, previousBlock);
            decryptedBlocks.push(xored);
            previousBlock = block;
        }
        return this.concatBlocks(decryptedBlocks);
    }
    processBlocks(data, key, encrypt) {
        const blocks = this.splitIntoBlocks(data, 8);
        const processedBlocks = blocks.map(block => encrypt ? this.encryptBlock(block, key) : this.decryptBlock(block, key));
        return this.concatBlocks(processedBlocks);
    }
    encryptBlock(block, key) {
        const words = block.words.slice();
        let v0 = words[0] || 0;
        let v1 = words[1] || 0;
        const keyArray = [
            key.words[0] || 0,
            key.words[1] || 0,
            key.words[2] || 0,
            key.words[3] || 0
        ];
        let sum = 0;
        for (let i = 0; i < this.XTEA_ROUNDS; i++) {
            v0 = (v0 + (((v1 << 4) ^ (v1 >>> 5)) + v1) ^ (sum + keyArray[sum & 3])) >>> 0;
            sum = (sum + this.XTEA_DELTA) >>> 0;
            v1 = (v1 + (((v0 << 4) ^ (v0 >>> 5)) + v0) ^ (sum + keyArray[(sum >>> 11) & 3])) >>> 0;
        }
        return CryptoJS.lib.WordArray.create([v0, v1], 8);
    }
    decryptBlock(block, key) {
        const words = block.words.slice();
        let v0 = words[0] || 0;
        let v1 = words[1] || 0;
        const keyArray = [
            key.words[0] || 0,
            key.words[1] || 0,
            key.words[2] || 0,
            key.words[3] || 0
        ];
        let sum = (this.XTEA_DELTA * this.XTEA_ROUNDS) >>> 0;
        for (let i = 0; i < this.XTEA_ROUNDS; i++) {
            v1 = (v1 - (((v0 << 4) ^ (v0 >>> 5)) + v0) ^ (sum + keyArray[(sum >>> 11) & 3])) >>> 0;
            sum = (sum - this.XTEA_DELTA) >>> 0;
            v0 = (v0 - (((v1 << 4) ^ (v1 >>> 5)) + v1) ^ (sum + keyArray[sum & 3])) >>> 0;
        }
        return CryptoJS.lib.WordArray.create([v0, v1], 8);
    }
    splitIntoBlocks(data, blockSize) {
        const blocks = [];
        const wordsPerBlock = blockSize / 4;
        for (let i = 0; i < data.words.length; i += wordsPerBlock) {
            const blockWords = data.words.slice(i, i + wordsPerBlock);
            while (blockWords.length < wordsPerBlock) {
                blockWords.push(0);
            }
            blocks.push(CryptoJS.lib.WordArray.create(blockWords, blockSize));
        }
        if (blocks.length === 0) {
            blocks.push(CryptoJS.lib.WordArray.create([0, 0], blockSize));
        }
        return blocks;
    }
    xorBlocks(a, b) {
        const result = a.words.slice();
        for (let i = 0; i < result.length && i < b.words.length; i++) {
            result[i] ^= b.words[i];
        }
        return CryptoJS.lib.WordArray.create(result, a.sigBytes);
    }
    concatBlocks(blocks) {
        const allWords = [];
        let totalBytes = 0;
        for (const block of blocks) {
            allWords.push(...block.words);
            totalBytes += block.sigBytes;
        }
        return CryptoJS.lib.WordArray.create(allWords, totalBytes);
    }
}
