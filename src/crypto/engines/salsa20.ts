import { CipherEngine, EncryptionParams, DecryptionParams, CryptoOperation, CipherMetadata } from '../../types/crypto';
import CryptoJS from 'crypto-js';

export class Salsa20Engine implements CipherEngine {
  readonly metadata: CipherMetadata = {
    id: 'salsa20',
    name: 'Salsa20',
    category: 'symmetric',
    variants: [
      { id: 'salsa20/8', name: 'Salsa20/8', keySize: 256 },
      { id: 'salsa20/12', name: 'Salsa20/12', keySize: 256 },
      { id: 'salsa20/20', name: 'Salsa20/20', keySize: 256 }
    ],
    modes: ['Stream'],
    description: 'Salsa20 stream cipher by Daniel J. Bernstein - eSTREAM finalist',
    keyRequirements: {
      minKeySize: 128,
      maxKeySize: 256,
      keySizes: [128, 256]
    },
    ivRequired: true,
    ivSize: 8,
    nonceRequired: true,
    nonceSize: 8,
    securityNotes: [
      {
        level: 'info',
        message: 'Salsa20 is an eSTREAM Portfolio finalist'
      },
      {
        level: 'info',
        message: 'Very fast in software, especially on x86'
      },
      {
        level: 'warning',
        message: 'Never reuse nonce with the same key'
      }
    ],
    references: [
      {
        title: 'The Salsa20 family of stream ciphers',
        url: 'https://cr.yp.to/snuffle.html'
      }
    ],
    complexity: 'medium',
    performance: 'fast'
  };

  async encrypt(params: EncryptionParams): Promise<CryptoOperation> {
    try {
      const { plaintext, key, nonce, variant = 'salsa20/20' } = params;
      
      if (!plaintext || !key) {
        throw new Error('Plaintext and key are required');
      }

      if (!nonce) {
        throw new Error('Nonce is required for Salsa20');
      }

      if (!this.validateKey(key)) {
        throw new Error('Invalid Salsa20 key. Must be 16 or 32 bytes');
      }

      if (!this.validateNonce(nonce)) {
        throw new Error('Invalid Salsa20 nonce. Must be 8 bytes');
      }

      console.warn('Salsa20 implementation using simplified approach - use proper Salsa20 library in production');

      const keyBytes = CryptoJS.enc.Hex.parse(key);
      const nonceBytes = CryptoJS.enc.Hex.parse(nonce);
      const plaintextBytes = CryptoJS.enc.Utf8.parse(plaintext);

      const rounds = this.getRoundsFromVariant(variant);
      const keystream = this.generateKeystream(keyBytes, nonceBytes, plaintextBytes.sigBytes, rounds);
      const encrypted = this.xorWithKeystream(plaintextBytes, keystream);      return {
        success: true,
        result: encrypted.toString(CryptoJS.enc.Hex),
        metadata: {
          keyLength: keyBytes.sigBytes * 8,
          nonceLength: 8,
          variant
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Salsa20 encryption failed'
      };
    }
  }

  async decrypt(params: DecryptionParams): Promise<CryptoOperation> {
    try {
      const { ciphertext, key, nonce, variant = 'salsa20/20' } = params;
      
      if (!ciphertext || !key) {
        throw new Error('Ciphertext and key are required');
      }

      if (!nonce) {
        throw new Error('Nonce is required for Salsa20');
      }

      if (!this.validateKey(key)) {
        throw new Error('Invalid Salsa20 key. Must be 16 or 32 bytes');
      }

      if (!this.validateNonce(nonce)) {
        throw new Error('Invalid Salsa20 nonce. Must be 8 bytes');
      }

      const keyBytes = CryptoJS.enc.Hex.parse(key);
      const nonceBytes = CryptoJS.enc.Hex.parse(nonce);
      const ciphertextBytes = CryptoJS.enc.Hex.parse(ciphertext);

      const rounds = this.getRoundsFromVariant(variant);
      const keystream = this.generateKeystream(keyBytes, nonceBytes, ciphertextBytes.sigBytes, rounds);
      const decrypted = this.xorWithKeystream(ciphertextBytes, keystream);      return {
        success: true,
        result: decrypted.toString(CryptoJS.enc.Utf8),
        metadata: {
          keyLength: keyBytes.sigBytes * 8,
          nonceLength: 8,
          variant
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Salsa20 decryption failed'
      };
    }
  }

  async generateKey(keySize: number = 256): Promise<string> {
    const validKeySizes = [128, 256];
    if (!validKeySizes.includes(keySize)) {
      keySize = 256;
    }
    const keyBytes = keySize / 8;
    const key = CryptoJS.lib.WordArray.random(keyBytes);
    return key.toString(CryptoJS.enc.Hex);
  }

  async generateIV(ivSize: number = 8): Promise<string> {
    return this.generateNonce();
  }

  async generateNonce(): Promise<string> {
    const nonce = CryptoJS.lib.WordArray.random(8);
    return nonce.toString(CryptoJS.enc.Hex);
  }

  validateKey(key: string, keySize?: number): boolean {
    try {
      const keyBytes = CryptoJS.enc.Hex.parse(key);
      return keyBytes.sigBytes === 16 || keyBytes.sigBytes === 32;
    } catch {
      return false;
    }
  }

  validateIV(iv: string): boolean {
    return this.validateNonce(iv);
  }

  validateNonce(nonce: string): boolean {
    try {
      const nonceBytes = CryptoJS.enc.Hex.parse(nonce);
      return nonceBytes.sigBytes === 8;
    } catch {
      return false;
    }
  }

  private getRoundsFromVariant(variant: string): number {
    const variantMap: { [key: string]: number } = {
      'salsa20/8': 8,
      'salsa20/12': 12,
      'salsa20/20': 20
    };
    return variantMap[variant] || 20;
  }

  private generateKeystream(key: CryptoJS.lib.WordArray, nonce: CryptoJS.lib.WordArray, length: number, rounds: number): CryptoJS.lib.WordArray {
    const blocks: number[] = [];
    const blocksNeeded = Math.ceil(length / 64); // Salsa20 produces 64-byte blocks

    for (let i = 0; i < blocksNeeded; i++) {
      const block = this.salsa20Block(key, nonce, i, rounds);
      blocks.push(...block);
    }

    // Trim to exact length needed
    const trimmedBytes = length;
    const trimmedWords = blocks.slice(0, Math.ceil(trimmedBytes / 4));
    return CryptoJS.lib.WordArray.create(trimmedWords, trimmedBytes);
  }

  private salsa20Block(key: CryptoJS.lib.WordArray, nonce: CryptoJS.lib.WordArray, counter: number, rounds: number): number[] {
    // Salsa20 constants
    const constants = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]; // "expand 32-byte k"
    
    // Initialize state
    const state = new Array(16);
    
    // Constants
    state[0] = constants[0];
    state[1] = key.words[0] || 0;
    state[2] = key.words[1] || 0;
    state[3] = key.words[2] || 0;
    state[4] = key.words[3] || 0;
    state[5] = constants[1];
    state[6] = nonce.words[0] || 0;
    state[7] = nonce.words[1] || 0;
    state[8] = counter;
    state[9] = 0; // High part of counter
    state[10] = constants[2];
    state[11] = key.words[4] || key.words[0] || 0;
    state[12] = key.words[5] || key.words[1] || 0;
    state[13] = key.words[6] || key.words[2] || 0;
    state[14] = key.words[7] || key.words[3] || 0;
    state[15] = constants[3];

    // Working state
    const workingState = state.slice();

    // Perform rounds
    for (let i = 0; i < rounds; i += 2) {
      // Column round
      this.quarterRound(workingState, 0, 4, 8, 12);
      this.quarterRound(workingState, 5, 9, 13, 1);
      this.quarterRound(workingState, 10, 14, 2, 6);
      this.quarterRound(workingState, 15, 3, 7, 11);

      // Row round
      this.quarterRound(workingState, 0, 1, 2, 3);
      this.quarterRound(workingState, 5, 6, 7, 4);
      this.quarterRound(workingState, 10, 11, 8, 9);
      this.quarterRound(workingState, 15, 12, 13, 14);
    }

    // Add original state
    for (let i = 0; i < 16; i++) {
      workingState[i] = (workingState[i] + state[i]) >>> 0;
    }

    return workingState;
  }

  private quarterRound(state: number[], a: number, b: number, c: number, d: number): void {
    state[b] ^= this.rotateLeft((state[a] + state[d]) >>> 0, 7);
    state[c] ^= this.rotateLeft((state[b] + state[a]) >>> 0, 9);
    state[d] ^= this.rotateLeft((state[c] + state[b]) >>> 0, 13);
    state[a] ^= this.rotateLeft((state[d] + state[c]) >>> 0, 18);
  }

  private rotateLeft(value: number, positions: number): number {
    return ((value << positions) | (value >>> (32 - positions))) >>> 0;
  }

  private xorWithKeystream(data: CryptoJS.lib.WordArray, keystream: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    const result = data.words.slice();
    
    for (let i = 0; i < result.length && i < keystream.words.length; i++) {
      result[i] ^= keystream.words[i];
    }

    return CryptoJS.lib.WordArray.create(result, data.sigBytes);
  }
}
