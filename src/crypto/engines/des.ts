import { CipherEngine, EncryptionParams, DecryptionParams, CryptoOperation, CipherMetadata } from '../../types/crypto';
import CryptoJS from 'crypto-js';

export class DESEngine implements CipherEngine {  readonly metadata: CipherMetadata = {
    id: 'des',
    name: 'DES',
    category: 'symmetric',
    variants: [
      { id: 'des-56', name: 'DES-56', keySize: 8 }
    ],
    modes: ['ECB', 'CBC', 'CFB', 'OFB'],
    description: 'Data Encryption Standard - Legacy symmetric cipher',
    keyRequirements: {
      minKeySize: 8,
      maxKeySize: 8,
      keySizes: [8]
    },
    ivRequired: true,
    ivSize: 8,
    nonceRequired: false,
    securityNotes: [
      {
        level: 'danger',
        message: 'DES is cryptographically broken and should not be used for secure applications'
      },
      {
        level: 'warning',
        message: 'DES has a 56-bit effective key size which is vulnerable to brute force attacks'
      }
    ],
    references: [
      {
        title: 'FIPS 46-3 - Data Encryption Standard',
        url: 'https://csrc.nist.gov/publications/detail/fips/46/3/final'
      }
    ],
    complexity: 'low',
    performance: 'fast'
  };

  async encrypt(params: EncryptionParams): Promise<CryptoOperation> {
    try {
      const { plaintext, key, iv, mode = 'CBC' } = params;
      
      if (!plaintext || !key) {
        throw new Error('Plaintext and key are required');
      }

      if (!this.validateKey(key)) {
        throw new Error('Invalid DES key. Must be 8 bytes (64 bits with parity)');
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
          encrypted = CryptoJS.DES.encrypt(plaintext, keyBytes, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          });
          break;
        case 'CBC':
          encrypted = CryptoJS.DES.encrypt(plaintext, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          });
          break;
        case 'CFB':
          encrypted = CryptoJS.DES.encrypt(plaintext, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
          });
          break;
        case 'OFB':
          encrypted = CryptoJS.DES.encrypt(plaintext, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.OFB,
            padding: CryptoJS.pad.NoPadding
          });
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }      return {
        success: true,
        result: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
        metadata: {
          keyLength: 8,
          ivLength: mode !== 'ECB' ? 8 : undefined,
          mode,
          variant: 'des-56',
          iv: finalIV
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DES encryption failed'
      };
    }
  }

  async decrypt(params: DecryptionParams): Promise<CryptoOperation> {
    try {
      const { ciphertext, key, iv, mode = 'CBC' } = params;
      
      if (!ciphertext || !key) {
        throw new Error('Ciphertext and key are required');
      }

      if (!this.validateKey(key)) {
        throw new Error('Invalid DES key. Must be 8 bytes (64 bits with parity)');
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
          decrypted = CryptoJS.DES.decrypt(cipherParams, keyBytes, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          });
          break;
        case 'CBC':
          if (!ivBytes) {
            throw new Error('IV is required for CBC mode');
          }
          decrypted = CryptoJS.DES.decrypt(cipherParams, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          });
          break;
        case 'CFB':
          if (!ivBytes) {
            throw new Error('IV is required for CFB mode');
          }
          decrypted = CryptoJS.DES.decrypt(cipherParams, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
          });
          break;
        case 'OFB':
          if (!ivBytes) {
            throw new Error('IV is required for OFB mode');
          }
          decrypted = CryptoJS.DES.decrypt(cipherParams, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.OFB,
            padding: CryptoJS.pad.NoPadding
          });
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }return {
        success: true,
        result: decrypted.toString(CryptoJS.enc.Utf8),
        metadata: {
          keyLength: 8,
          ivLength: mode !== 'ECB' ? 8 : undefined,
          mode,
          variant: 'des-56'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DES decryption failed'
      };
    }
  }
  async generateKey(keySize: number = 8): Promise<string> {
    // Validate keySize
    if (!this.metadata.keyRequirements.keySizes.includes(keySize)) {
      throw new Error(`Invalid key size. Supported sizes: ${this.metadata.keyRequirements.keySizes.join(', ')} bytes`);
    }
    // Generate 64-bit key (8 bytes) with proper parity bits
    const key = CryptoJS.lib.WordArray.random(8);
    return key.toString(CryptoJS.enc.Hex);
  }

  async generateIV(ivSize: number = 8): Promise<string> {
    const iv = CryptoJS.lib.WordArray.random(ivSize);
    return iv.toString(CryptoJS.enc.Hex);
  }

  validateKey(key: string, keySize?: number): boolean {
    try {
      const keyBytes = CryptoJS.enc.Hex.parse(key);
      return keyBytes.sigBytes === 8; // 64 bits
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
}
