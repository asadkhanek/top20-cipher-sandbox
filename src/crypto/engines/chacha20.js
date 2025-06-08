import { generateRandomHex, validateKeyLength, isValidHex } from '@/lib/crypto-utils';
// Simple ChaCha20 implementation for demonstration
// Note: In production, use a well-tested library like tweetnacl or node-forge
class ChaCha20 {
    static rotateLeft(n, amount) {
        return ((n << amount) | (n >>> (32 - amount))) >>> 0;
    }
    static quarterRound(state, a, b, c, d) {
        state[a] = (state[a] + state[b]) >>> 0;
        state[d] ^= state[a];
        state[d] = this.rotateLeft(state[d], 16);
        state[c] = (state[c] + state[d]) >>> 0;
        state[b] ^= state[c];
        state[b] = this.rotateLeft(state[b], 12);
        state[a] = (state[a] + state[b]) >>> 0;
        state[d] ^= state[a];
        state[d] = this.rotateLeft(state[d], 8);
        state[c] = (state[c] + state[d]) >>> 0;
        state[b] ^= state[c];
        state[b] = this.rotateLeft(state[b], 7);
    }
    static chacha20Block(key, nonce, counter) {
        const state = new Uint32Array(16);
        const constants = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);
        // Constants
        state.set(constants, 0);
        // Key
        for (let i = 0; i < 8; i++) {
            state[4 + i] = (key[i * 4] | (key[i * 4 + 1] << 8) | (key[i * 4 + 2] << 16) | (key[i * 4 + 3] << 24)) >>> 0;
        }
        // Counter
        state[12] = counter;
        // Nonce
        for (let i = 0; i < 3; i++) {
            state[13 + i] = (nonce[i * 4] | (nonce[i * 4 + 1] << 8) | (nonce[i * 4 + 2] << 16) | (nonce[i * 4 + 3] << 24)) >>> 0;
        }
        const workingState = new Uint32Array(state);
        // 20 rounds
        for (let i = 0; i < 10; i++) {
            this.quarterRound(workingState, 0, 4, 8, 12);
            this.quarterRound(workingState, 1, 5, 9, 13);
            this.quarterRound(workingState, 2, 6, 10, 14);
            this.quarterRound(workingState, 3, 7, 11, 15);
            this.quarterRound(workingState, 0, 5, 10, 15);
            this.quarterRound(workingState, 1, 6, 11, 12);
            this.quarterRound(workingState, 2, 7, 8, 13);
            this.quarterRound(workingState, 3, 4, 9, 14);
        }
        // Add original state
        for (let i = 0; i < 16; i++) {
            workingState[i] = (workingState[i] + state[i]) >>> 0;
        }
        // Convert to bytes
        const output = new Uint8Array(64);
        for (let i = 0; i < 16; i++) {
            output[i * 4] = workingState[i] & 0xff;
            output[i * 4 + 1] = (workingState[i] >>> 8) & 0xff;
            output[i * 4 + 2] = (workingState[i] >>> 16) & 0xff;
            output[i * 4 + 3] = (workingState[i] >>> 24) & 0xff;
        }
        return output;
    }
    static encrypt(plaintext, key, nonce) {
        const output = new Uint8Array(plaintext.length);
        let counter = 0;
        for (let i = 0; i < plaintext.length; i += 64) {
            const keystream = this.chacha20Block(key, nonce, counter);
            const remaining = Math.min(64, plaintext.length - i);
            for (let j = 0; j < remaining; j++) {
                output[i + j] = plaintext[i + j] ^ keystream[j];
            }
            counter++;
        }
        return output;
    }
}
export class ChaCha20Engine {
    constructor() {
        this.metadata = {
            id: 'chacha20',
            name: 'ChaCha20',
            category: 'symmetric',
            variants: [
                { id: 'chacha20', name: 'ChaCha20', keySize: 32 }
            ],
            modes: ['Stream'],
            description: 'ChaCha20 is a stream cipher developed by Daniel J. Bernstein. It\'s designed to be faster than AES in software-only implementations while providing similar security.',
            keyRequirements: {
                minKeySize: 32,
                maxKeySize: 32,
                keySizes: [32]
            },
            ivRequired: false,
            nonceRequired: true,
            nonceSize: 12,
            securityNotes: [
                {
                    level: 'info',
                    message: 'ChaCha20 is considered very secure and is used in modern protocols like TLS 1.3.'
                },
                {
                    level: 'warning',
                    message: 'Never reuse the same nonce with the same key.'
                }
            ],
            references: [
                {
                    title: 'RFC 8439 - ChaCha20 and Poly1305 for IETF Protocols',
                    url: 'https://tools.ietf.org/html/rfc8439'
                }
            ],
            complexity: 'low',
            performance: 'fast'
        };
    }
    hexToUint8Array(hex) {
        const result = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            result[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return result;
    }
    uint8ArrayToHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    async encrypt(params) {
        try {
            const { plaintext, key, nonce } = params;
            // Validate key
            if (!this.validateKey(key)) {
                return {
                    success: false,
                    error: 'Invalid key length. Expected 32 bytes (64 hex characters).'
                };
            }
            // Validate nonce
            if (!nonce || !this.validateNonce(nonce)) {
                return {
                    success: false,
                    error: 'Invalid nonce length. Expected 12 bytes (24 hex characters).'
                };
            }
            // Convert inputs
            const plaintextBytes = new TextEncoder().encode(plaintext);
            const keyBytes = this.hexToUint8Array(key);
            const nonceBytes = this.hexToUint8Array(nonce);
            // Encrypt
            const ciphertext = ChaCha20.encrypt(plaintextBytes, keyBytes, nonceBytes);
            return {
                success: true,
                result: this.uint8ArrayToHex(ciphertext),
                metadata: {
                    keyLength: 32,
                    nonceLength: 12,
                    mode: 'Stream',
                    variant: 'chacha20'
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
            const { ciphertext, key, nonce } = params;
            // Validate key
            if (!this.validateKey(key)) {
                return {
                    success: false,
                    error: 'Invalid key length. Expected 32 bytes (64 hex characters).'
                };
            }
            // Validate nonce
            if (!nonce || !this.validateNonce(nonce)) {
                return {
                    success: false,
                    error: 'Invalid nonce length. Expected 12 bytes (24 hex characters).'
                };
            }
            // Validate ciphertext
            if (!isValidHex(ciphertext)) {
                return {
                    success: false,
                    error: 'Invalid ciphertext format. Must be valid hexadecimal.'
                };
            }
            // Convert inputs
            const ciphertextBytes = this.hexToUint8Array(ciphertext);
            const keyBytes = this.hexToUint8Array(key);
            const nonceBytes = this.hexToUint8Array(nonce);
            // Decrypt (same operation as encrypt for stream cipher)
            const plaintext = ChaCha20.encrypt(ciphertextBytes, keyBytes, nonceBytes);
            const plaintextString = new TextDecoder().decode(plaintext);
            return {
                success: true,
                result: plaintextString,
                metadata: {
                    keyLength: 32,
                    nonceLength: 12,
                    mode: 'Stream',
                    variant: 'chacha20'
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
    async generateKey() {
        return generateRandomHex(32);
    }
    async generateNonce() {
        return generateRandomHex(12);
    }
    validateKey(key) {
        return validateKeyLength(key, [32], 'hex');
    }
    validateNonce(nonce) {
        return validateKeyLength(nonce, [12], 'hex');
    }
}
export default ChaCha20Engine;
