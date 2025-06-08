import CryptoJS from 'crypto-js';
export class Cast128Engine {
    constructor() {
        this.metadata = {
            id: 'cast128',
            name: 'CAST-128',
            category: 'symmetric',
            variants: [
                { id: 'cast128-128', name: 'CAST-128', keySize: 128 }
            ],
            modes: ['ECB', 'CBC', 'CFB', 'OFB'],
            description: 'CAST-128 (CAST5) block cipher - widely used in OpenPGP',
            keyRequirements: {
                minKeySize: 40,
                maxKeySize: 128,
                keySizes: [40, 56, 64, 80, 96, 112, 128]
            },
            ivRequired: true,
            ivSize: 8,
            nonceRequired: false,
            securityNotes: [
                {
                    level: 'info',
                    message: 'CAST-128 is the default cipher in OpenPGP (RFC 4880)'
                },
                {
                    level: 'warning',
                    message: '64-bit block size makes it vulnerable to birthday attacks with large amounts of data'
                }
            ],
            references: [
                {
                    title: 'RFC 2144: The CAST-128 Encryption Algorithm',
                    url: 'https://tools.ietf.org/rfc/rfc2144.txt'
                }
            ],
            complexity: 'medium',
            performance: 'medium'
        };
        this.CAST128_ROUNDS = 16;
        this.BLOCK_SIZE = 8; // 64 bits
    }
    async encrypt(params) {
        try {
            const { plaintext, key, iv, mode = 'CBC', variant = 'cast128-128' } = params;
            if (!plaintext || !key) {
                throw new Error('Plaintext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid CAST-128 key. Must be 5-16 bytes (40-128 bits)');
            }
            // Custom CAST-128 implementation placeholder
            console.warn('CAST-128 implementation using simplified approach - use proper CAST-128 library in production');
            const keyBytes = CryptoJS.enc.Hex.parse(key);
            const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : CryptoJS.lib.WordArray.random(8);
            const plaintextBytes = CryptoJS.enc.Utf8.parse(plaintext);
            // Simplified implementation using modified AES with 64-bit blocks
            let encrypted;
            if (mode === 'ECB') {
                encrypted = this.encryptECB(plaintextBytes, keyBytes);
            }
            else if (mode === 'CBC') {
                encrypted = this.encryptCBC(plaintextBytes, keyBytes, ivBytes);
            }
            else {
                throw new Error(`Mode ${mode} not implemented for CAST-128`);
            }
            return {
                success: true,
                result: encrypted,
                metadata: {
                    keyLength: keyBytes.sigBytes * 8,
                    ivLength: mode !== 'ECB' ? 8 : undefined,
                    mode,
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'CAST-128 encryption failed'
            };
        }
    }
    async decrypt(params) {
        try {
            const { ciphertext, key, iv, mode = 'CBC', variant = 'cast128-128' } = params;
            if (!ciphertext || !key) {
                throw new Error('Ciphertext and key are required');
            }
            if (!this.validateKey(key)) {
                throw new Error('Invalid CAST-128 key. Must be 5-16 bytes (40-128 bits)');
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
                throw new Error(`Mode ${mode} not implemented for CAST-128`);
            }
            return {
                success: true,
                result: decrypted.toString(CryptoJS.enc.Utf8),
                metadata: {
                    keyLength: keyBytes.sigBytes * 8,
                    ivLength: mode !== 'ECB' ? 8 : undefined,
                    mode,
                    variant
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'CAST-128 decryption failed'
            };
        }
    }
    async generateKey(keySize = 128) {
        const validKeySizes = [40, 56, 64, 80, 96, 112, 128];
        if (!validKeySizes.includes(keySize)) {
            keySize = 128; // Default to maximum
        }
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
            return keyBytes.sigBytes >= 5 && keyBytes.sigBytes <= 16;
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
        // Simplified CAST-128 ECB implementation
        const result = this.processBlocks(plaintext, key, true);
        return result.toString(CryptoJS.enc.Hex);
    }
    decryptECB(ciphertext, key) {
        return this.processBlocks(ciphertext, key, false);
    }
    encryptCBC(plaintext, key, iv) {
        // Simplified CBC mode
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
        // Simplified CAST-128 block encryption (placeholder)
        // In real implementation, this would use CAST-128's F-function and round structure
        return this.simpleFeistel(block, key, true);
    }
    decryptBlock(block, key) {
        return this.simpleFeistel(block, key, false);
    }
    simpleFeistel(block, key, encrypt) {
        // Simplified Feistel structure for demonstration
        const words = block.words.slice();
        let left = words[0] || 0;
        let right = words[1] || 0;
        const rounds = encrypt ?
            Array.from({ length: this.CAST128_ROUNDS }, (_, i) => i) :
            Array.from({ length: this.CAST128_ROUNDS }, (_, i) => this.CAST128_ROUNDS - 1 - i);
        for (const round of rounds) {
            const temp = left;
            const roundKey = key.words[round % key.words.length] || 0;
            left = right ^ this.fFunction(left, roundKey, round);
            right = temp;
        }
        return CryptoJS.lib.WordArray.create([right, left], 8);
    }
    fFunction(data, key, round) {
        // Simplified F-function (placeholder)
        const rotated = this.rotateLeft(data ^ key, (round % 32) + 1);
        return rotated + round;
    }
    rotateLeft(value, positions) {
        return ((value << positions) | (value >>> (32 - positions))) >>> 0;
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
