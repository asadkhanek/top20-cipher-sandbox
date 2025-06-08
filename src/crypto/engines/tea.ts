import { CipherEngine, EncryptionParams, DecryptionParams, CryptoOperation, CipherMetadata } from '../../types/crypto';
import CryptoJS from 'crypto-js';

export class TeaEngine implements CipherEngine {
  readonly metadata: CipherMetadata = {
    id: 'tea',
    name: 'TEA',
    category: 'symmetric',
    variants: [
      { id: 'tea', name: 'TEA', keySize: 128 }
    ],
    modes: ['ECB', 'CBC'],
    description: 'Tiny Encryption Algorithm - simple Feistel cipher',
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
        level: 'warning',
        message: 'TEA has known weaknesses and should not be used for new applications'
      },
      {
        level: 'warning',
        message: 'Vulnerable to related-key attacks'
      },
      {
        level: 'info',
        message: 'Primarily of historical and educational interest'
      }
    ],
    references: [
      {
        title: 'TEA, a Tiny Encryption Algorithm',
        url: 'https://en.wikipedia.org/wiki/Tiny_Encryption_Algorithm'
      }
    ],
    complexity: 'low',
    performance: 'fast'
  };

  private readonly TEA_ROUNDS = 32;
  private readonly TEA_DELTA = 0x9e3779b9;
  private readonly BLOCK_SIZE = 8; // 64 bits

  async encrypt(params: EncryptionParams): Promise<CryptoOperation> {
    try {
      const { plaintext, key, iv, mode = 'CBC', variant = 'tea' } = params;
      
      if (!plaintext || !key) {
        throw new Error('Plaintext and key are required');
      }

      if (!this.validateKey(key)) {
        throw new Error('Invalid TEA key. Must be exactly 16 bytes (128 bits)');
      }

      const keyBytes = CryptoJS.enc.Hex.parse(key);
      const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : CryptoJS.lib.WordArray.random(8);
      const plaintextBytes = CryptoJS.enc.Utf8.parse(plaintext);

      let encrypted: string;
      
      if (mode === 'ECB') {
        encrypted = this.encryptECB(plaintextBytes, keyBytes);
      } else if (mode === 'CBC') {
        encrypted = this.encryptCBC(plaintextBytes, keyBytes, ivBytes);
      } else {
        throw new Error(`Mode ${mode} not implemented for TEA`);
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TEA encryption failed'
      };
    }
  }

  async decrypt(params: DecryptionParams): Promise<CryptoOperation> {
    try {
      const { ciphertext, key, iv, mode = 'CBC', variant = 'tea' } = params;
      
      if (!ciphertext || !key) {
        throw new Error('Ciphertext and key are required');
      }

      if (!this.validateKey(key)) {
        throw new Error('Invalid TEA key. Must be exactly 16 bytes (128 bits)');
      }

      const keyBytes = CryptoJS.enc.Hex.parse(key);
      const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : undefined;
      const ciphertextBytes = CryptoJS.enc.Hex.parse(ciphertext);

      let decrypted: CryptoJS.lib.WordArray;
      
      if (mode === 'ECB') {
        decrypted = this.decryptECB(ciphertextBytes, keyBytes);
      } else if (mode === 'CBC') {
        if (!ivBytes) {
          throw new Error('IV is required for CBC mode');
        }
        decrypted = this.decryptCBC(ciphertextBytes, keyBytes, ivBytes);
      } else {
        throw new Error(`Mode ${mode} not implemented for TEA`);
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TEA decryption failed'
      };
    }
  }

  async generateKey(keySize: number = 128): Promise<string> {
    const key = CryptoJS.lib.WordArray.random(16);
    return key.toString(CryptoJS.enc.Hex);
  }

  async generateIV(ivSize: number = 8): Promise<string> {
    const iv = CryptoJS.lib.WordArray.random(ivSize);
    return iv.toString(CryptoJS.enc.Hex);
  }

  validateKey(key: string, keySize?: number): boolean {
    try {
      const keyBytes = CryptoJS.enc.Hex.parse(key);
      return keyBytes.sigBytes === 16;
    } catch {
      return false;
    }
  }

  validateIV(iv: string): boolean {
    try {
      const ivBytes = CryptoJS.enc.Hex.parse(iv);
      return ivBytes.sigBytes === 8;
    } catch {
      return false;
    }
  }

  private encryptECB(plaintext: CryptoJS.lib.WordArray, key: CryptoJS.lib.WordArray): string {
    const result = this.processBlocks(plaintext, key, true);
    return result.toString(CryptoJS.enc.Hex);
  }

  private decryptECB(ciphertext: CryptoJS.lib.WordArray, key: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    return this.processBlocks(ciphertext, key, false);
  }

  private encryptCBC(plaintext: CryptoJS.lib.WordArray, key: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): string {
    const blocks = this.splitIntoBlocks(plaintext, 8);
    let previousBlock = iv;
    const encryptedBlocks: CryptoJS.lib.WordArray[] = [];

    for (const block of blocks) {
      const xored = this.xorBlocks(block, previousBlock);
      const encrypted = this.encryptBlock(xored, key);
      encryptedBlocks.push(encrypted);
      previousBlock = encrypted;
    }

    return this.concatBlocks(encryptedBlocks).toString(CryptoJS.enc.Hex);
  }

  private decryptCBC(ciphertext: CryptoJS.lib.WordArray, key: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    const blocks = this.splitIntoBlocks(ciphertext, 8);
    let previousBlock = iv;
    const decryptedBlocks: CryptoJS.lib.WordArray[] = [];

    for (const block of blocks) {
      const decrypted = this.decryptBlock(block, key);
      const xored = this.xorBlocks(decrypted, previousBlock);
      decryptedBlocks.push(xored);
      previousBlock = block;
    }

    return this.concatBlocks(decryptedBlocks);
  }

  private processBlocks(data: CryptoJS.lib.WordArray, key: CryptoJS.lib.WordArray, encrypt: boolean): CryptoJS.lib.WordArray {
    const blocks = this.splitIntoBlocks(data, 8);
    const processedBlocks = blocks.map(block => 
      encrypt ? this.encryptBlock(block, key) : this.decryptBlock(block, key)
    );
    return this.concatBlocks(processedBlocks);
  }

  private encryptBlock(block: CryptoJS.lib.WordArray, key: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    const words = block.words.slice();
    let v0 = words[0] || 0;
    let v1 = words[1] || 0;
    
    const k0 = key.words[0] || 0;
    const k1 = key.words[1] || 0;
    const k2 = key.words[2] || 0;
    const k3 = key.words[3] || 0;
    
    let sum = 0;
    
    for (let i = 0; i < this.TEA_ROUNDS; i++) {
      sum = (sum + this.TEA_DELTA) >>> 0;
      v0 = (v0 + (((v1 << 4) + k0) ^ (v1 + sum) ^ ((v1 >>> 5) + k1))) >>> 0;
      v1 = (v1 + (((v0 << 4) + k2) ^ (v0 + sum) ^ ((v0 >>> 5) + k3))) >>> 0;
    }
    
    return CryptoJS.lib.WordArray.create([v0, v1], 8);
  }

  private decryptBlock(block: CryptoJS.lib.WordArray, key: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    const words = block.words.slice();
    let v0 = words[0] || 0;
    let v1 = words[1] || 0;
    
    const k0 = key.words[0] || 0;
    const k1 = key.words[1] || 0;
    const k2 = key.words[2] || 0;
    const k3 = key.words[3] || 0;
    
    let sum = (this.TEA_DELTA * this.TEA_ROUNDS) >>> 0;
    
    for (let i = 0; i < this.TEA_ROUNDS; i++) {
      v1 = (v1 - (((v0 << 4) + k2) ^ (v0 + sum) ^ ((v0 >>> 5) + k3))) >>> 0;
      v0 = (v0 - (((v1 << 4) + k0) ^ (v1 + sum) ^ ((v1 >>> 5) + k1))) >>> 0;
      sum = (sum - this.TEA_DELTA) >>> 0;
    }
    
    return CryptoJS.lib.WordArray.create([v0, v1], 8);
  }

  private splitIntoBlocks(data: CryptoJS.lib.WordArray, blockSize: number): CryptoJS.lib.WordArray[] {
    const blocks: CryptoJS.lib.WordArray[] = [];
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

  private xorBlocks(a: CryptoJS.lib.WordArray, b: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    const result = a.words.slice();
    for (let i = 0; i < result.length && i < b.words.length; i++) {
      result[i] ^= b.words[i];
    }
    return CryptoJS.lib.WordArray.create(result, a.sigBytes);
  }

  private concatBlocks(blocks: CryptoJS.lib.WordArray[]): CryptoJS.lib.WordArray {
    const allWords: number[] = [];
    let totalBytes = 0;
    
    for (const block of blocks) {
      allWords.push(...block.words);
      totalBytes += block.sigBytes;
    }
    
    return CryptoJS.lib.WordArray.create(allWords, totalBytes);
  }
}
