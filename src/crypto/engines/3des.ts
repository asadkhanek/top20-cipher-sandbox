import { CipherEngine, EncryptionParams, DecryptionParams, CryptoOperation, CipherMetadata } from '../../types/crypto';
import CryptoJS from 'crypto-js';

export class TripleDESEngine implements CipherEngine {  readonly metadata: CipherMetadata = {
    id: '3des',
    name: '3DES',
    category: 'symmetric',
    variants: [
      { id: '3des-112', name: '3DES-112 (2-key)', keySize: 16 },
      { id: '3des-168', name: '3DES-168 (3-key)', keySize: 24 }
    ],
    modes: ['ECB', 'CBC', 'CFB', 'OFB'],
    description: 'Triple Data Encryption Standard - Enhanced version of DES',
    keyRequirements: {
      minKeySize: 16,
      maxKeySize: 24,
      keySizes: [16, 24]
    },
    ivRequired: true,
    ivSize: 8,
    nonceRequired: false,
    securityNotes: [
      {
        level: 'warning',
        message: '3DES is deprecated and will be phased out by 2023'
      },
      {
        level: 'info',
        message: '3DES provides better security than DES but is slower than modern ciphers'
      }
    ],
    references: [
      {
        title: 'NIST SP 800-67 - Recommendation for Triple DES',
        url: 'https://csrc.nist.gov/publications/detail/sp/800-67/rev-2/final'
      }
    ],
    complexity: 'medium',
    performance: 'medium'
  };

  async encrypt(params: EncryptionParams): Promise<CryptoOperation> {
    try {
      const { plaintext, key, iv, mode = 'CBC', variant = '3des-168' } = params;
      
      if (!plaintext || !key) {
        throw new Error('Plaintext and key are required');
      }

      if (!this.validateKey(key)) {
        throw new Error('Invalid 3DES key. Must be 16 bytes (2-key) or 24 bytes (3-key)');
      }      const keyBytes = CryptoJS.enc.Hex.parse(key);
      
      // Generate IV if not provided and mode requires it
      let finalIV = iv;
      if (!finalIV && mode !== 'ECB') {
        finalIV = await this.generateIV();
      }
      
      const ivBytes = finalIV ? CryptoJS.enc.Hex.parse(finalIV) : undefined;

      let encrypted: CryptoJS.lib.CipherParams;
      
      switch (mode) {
        case 'ECB':
          encrypted = CryptoJS.TripleDES.encrypt(plaintext, keyBytes, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          });
          break;
        case 'CBC':
          encrypted = CryptoJS.TripleDES.encrypt(plaintext, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          });
          break;
        case 'CFB':
          encrypted = CryptoJS.TripleDES.encrypt(plaintext, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
          });
          break;
        case 'OFB':
          encrypted = CryptoJS.TripleDES.encrypt(plaintext, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.OFB,
            padding: CryptoJS.pad.NoPadding
          });
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }

      const keyLength = this.getKeyLengthFromVariant(variant);      return {
        success: true,
        result: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
        metadata: {
          keyLength,
          ivLength: mode !== 'ECB' ? 8 : undefined,
          mode,
          variant,
          iv: finalIV
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '3DES encryption failed'
      };
    }
  }

  async decrypt(params: DecryptionParams): Promise<CryptoOperation> {
    try {
      const { ciphertext, key, iv, mode = 'CBC', variant = '3des-168' } = params;
      
      if (!ciphertext || !key) {
        throw new Error('Ciphertext and key are required');
      }

      if (!this.validateKey(key)) {
        throw new Error('Invalid 3DES key. Must be 16 bytes (2-key) or 24 bytes (3-key)');
      }      const keyBytes = CryptoJS.enc.Hex.parse(key);
      const ivBytes = iv ? CryptoJS.enc.Hex.parse(iv) : undefined;

      // Create cipher params for hex ciphertext
      const ciphertextWords = CryptoJS.enc.Hex.parse(ciphertext);
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertextWords
      });

      let decrypted: CryptoJS.lib.WordArray;
        switch (mode) {
        case 'ECB':
          decrypted = CryptoJS.TripleDES.decrypt(cipherParams, keyBytes, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          });
          break;
        case 'CBC':
          if (!ivBytes) {
            throw new Error('IV is required for CBC mode');
          }
          decrypted = CryptoJS.TripleDES.decrypt(cipherParams, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          });
          break;
        case 'CFB':
          if (!ivBytes) {
            throw new Error('IV is required for CFB mode');
          }
          decrypted = CryptoJS.TripleDES.decrypt(cipherParams, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
          });
          break;
        case 'OFB':
          if (!ivBytes) {
            throw new Error('IV is required for OFB mode');
          }
          decrypted = CryptoJS.TripleDES.decrypt(cipherParams, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.OFB,
            padding: CryptoJS.pad.NoPadding
          });
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }

      const keyLength = this.getKeyLengthFromVariant(variant);

      return {
        success: true,
        result: decrypted.toString(CryptoJS.enc.Utf8),
        metadata: {
          keyLength,
          ivLength: mode !== 'ECB' ? 8 : undefined,
          mode,
          variant
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '3DES decryption failed'
      };
    }
  }

  async generateKey(keySize: number = 168): Promise<string> {
    // Generate key based on size: 16 bytes for 2-key, 24 bytes for 3-key
    const keyBytes = keySize === 112 ? 16 : 24;
    const key = CryptoJS.lib.WordArray.random(keyBytes);
    return key.toString(CryptoJS.enc.Hex);
  }

  async generateIV(ivSize: number = 8): Promise<string> {
    const iv = CryptoJS.lib.WordArray.random(ivSize);
    return iv.toString(CryptoJS.enc.Hex);
  }

  validateKey(key: string, keySize?: number): boolean {
    try {
      const keyBytes = CryptoJS.enc.Hex.parse(key);
      // 3DES keys can be 16 bytes (2-key) or 24 bytes (3-key)
      return keyBytes.sigBytes === 16 || keyBytes.sigBytes === 24;
    } catch {
      return false;
    }
  }

  validateIV(iv: string): boolean {
    try {
      const ivBytes = CryptoJS.enc.Hex.parse(iv);
      return ivBytes.sigBytes === 8; // 64 bits
    } catch {
      return false;
    }
  }

  private getKeyLengthFromVariant(variant: string): number {
    return variant === '3des-112' ? 112 : 168;
  }
}
