import { CipherEngine, CipherMetadata, EncryptionParams, DecryptionParams, CryptoOperation } from '../../types/crypto';
import CryptoJS from 'crypto-js';

export class IdeaEngine implements CipherEngine {
  readonly metadata: CipherMetadata = {
    id: 'idea',
    name: 'IDEA',
    category: 'symmetric',
    variants: [
      { id: 'idea', name: 'IDEA', keySize: 16 }
    ],
    modes: ['ECB', 'CBC'],
    description: 'International Data Encryption Algorithm (demo implementation using AES fallback)',
    keyRequirements: {
      minKeySize: 16,
      maxKeySize: 16,
      keySizes: [16]
    },
    ivRequired: true,
    ivSize: 8,
    nonceRequired: false,
    securityNotes: [
      {
        level: 'warning',
        message: 'This is a demo implementation using AES fallback - not real IDEA'
      },
      {
        level: 'info',
        message: 'IDEA is patented and requires licensing for commercial use'
      }
    ],
    references: [
      {
        title: 'IDEA Cipher',
        url: 'https://en.wikipedia.org/wiki/International_Data_Encryption_Algorithm'
      }
    ],
    complexity: 'medium',
    performance: 'medium'
  };

  async encrypt(params: EncryptionParams): Promise<CryptoOperation> {
    try {
      const { plaintext, key, iv, mode = 'CBC' } = params;
      
      if (!plaintext || !key) {
        throw new Error('Plaintext and key are required');
      }

      const keyBuffer = CryptoJS.enc.Utf8.parse(key.padEnd(16, '0'));
      const ivBuffer = iv ? CryptoJS.enc.Hex.parse(iv) : CryptoJS.lib.WordArray.random(8);

      console.warn('IDEA implementation using AES fallback - not real IDEA');
      
      const encrypted = CryptoJS.AES.encrypt(plaintext, keyBuffer, {
        iv: ivBuffer,
        mode: mode === 'ECB' ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        success: true,
        result: encrypted.toString(),
        metadata: {
          keyLength: 16,
          mode,
          variant: 'idea',
          iv: ivBuffer.toString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'IDEA encryption failed'
      };
    }
  }

  async decrypt(params: DecryptionParams): Promise<CryptoOperation> {
    try {
      const { ciphertext, key, iv, mode = 'CBC' } = params;
      
      if (!ciphertext || !key) {
        throw new Error('Ciphertext and key are required');
      }

      const keyBuffer = CryptoJS.enc.Utf8.parse(key.padEnd(16, '0'));
      const ivBuffer = iv ? CryptoJS.enc.Hex.parse(iv) : undefined;

      console.warn('IDEA implementation using AES fallback - not real IDEA');
      
      const decrypted = CryptoJS.AES.decrypt(ciphertext, keyBuffer, {
        iv: ivBuffer,
        mode: mode === 'ECB' ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        success: true,
        result: decrypted.toString(CryptoJS.enc.Utf8),
        metadata: {
          keyLength: 16,
          mode,
          variant: 'idea'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'IDEA decryption failed'
      };
    }
  }

  async generateKey(): Promise<string> {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  validateKey(key: string): boolean {
    return key.length === 16 || key.length === 32; // Support hex keys too
  }
}
