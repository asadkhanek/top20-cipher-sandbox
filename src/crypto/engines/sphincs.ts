import { CipherEngine, CipherMetadata, EncryptionParams, DecryptionParams, CryptoOperation } from '../../types/crypto';
import CryptoJS from 'crypto-js';

export class SphincsEngine implements CipherEngine {
  readonly metadata: CipherMetadata = {
    id: 'sphincs',
    name: 'SPHINCS+',
    category: 'symmetric',
    variants: [
      { id: 'sphincs-128', name: 'SPHINCS+-128', keySize: 16 },
      { id: 'sphincs-192', name: 'SPHINCS+-192', keySize: 24 },
      { id: 'sphincs-256', name: 'SPHINCS+-256', keySize: 32 }
    ],
    modes: ['CBC'],
    description: 'SPHINCS+ cipher (using AES as fallback)',
    keyRequirements: {
      minKeySize: 16,
      maxKeySize: 32,
      keySizes: [16, 24, 32]
    },
    ivRequired: true,
    ivSize: 16,
    nonceRequired: false,
    securityNotes: [{ level: 'info', message: 'SPHINCS+ fallback implementation using AES.' }],
    references: [{ title: 'SPHINCS+ Cipher', url: 'https://example.com' }],
    complexity: 'medium',
    performance: 'fast'
  };

  async encrypt(params: EncryptionParams): Promise<CryptoOperation> {
    try {
      const { plaintext, key, iv, mode = 'CBC' } = params;
      
      if (!this.validateKey(key)) {
        throw new Error('Invalid key format or length');
      }
      
      // Convert key to CryptoJS format
      const keyWords = CryptoJS.enc.Hex.parse(key);
      const finalIV = iv || CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
      const ivWords = CryptoJS.enc.Hex.parse(finalIV);
      
      // Use AES as fallback since SPHINCS+ is not supported by CryptoJS
      const options: any = {
        iv: ivWords,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      };
      
      const encrypted = CryptoJS.AES.encrypt(plaintext, keyWords, options);
      
      return {
        success: true,
        result: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
        metadata: {
          keyLength: keyWords.sigBytes,
          ivLength: 16,
          mode: 'CBC',
          variant: `sphincs-${keyWords.sigBytes * 8}`,
          iv: finalIV
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown encryption error'
      };
    }
  }

  async decrypt(params: DecryptionParams): Promise<CryptoOperation> {
    try {
      const { ciphertext, key, iv } = params;
      
      if (!this.validateKey(key) || !iv) {
        throw new Error('Invalid key or missing IV');
      }

      // Convert key, IV, and ciphertext to CryptoJS format
      const keyWords = CryptoJS.enc.Hex.parse(key);
      const ivWords = CryptoJS.enc.Hex.parse(iv);
      const ciphertextWords = CryptoJS.enc.Hex.parse(ciphertext);
      
      // Create cipher params object
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertextWords
      });
      
      const options: any = {
        iv: ivWords,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      };
      
      const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWords, options);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        throw new Error('Failed to decrypt - invalid key, IV, or corrupted data');
      }
      
      return {
        success: true,
        result: plaintext
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown decryption error'
      };
    }
  }

  async generateKey(keySize?: number): Promise<string> {
    const size = keySize || 32;
    if (![16, 24, 32].includes(size)) {
      throw new Error('Key size must be 16, 24, or 32 bytes');
    }
    return CryptoJS.lib.WordArray.random(size).toString(CryptoJS.enc.Hex);
  }

  validateKey(key: string, keySize?: number): boolean {
    try {
      const keyWords = CryptoJS.enc.Hex.parse(key);
      const validSizes = [16, 24, 32];
      
      if (keySize) {
        return keyWords.sigBytes === keySize;
      }
      
      return validSizes.includes(keyWords.sigBytes);
    } catch {
      return false;
    }
  }
}

export default SphincsEngine;
