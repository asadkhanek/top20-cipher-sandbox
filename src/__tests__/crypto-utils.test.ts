/**
 * @jest-environment jsdom
 */

import { 
  getRandomBytes, 
  generateRandomHex, 
  stringToHex, 
  hexToString, 
  stringToBase64, 
  base64ToString, 
  isValidHex, 
  isValidBase64, 
  validateKeyLength, 
  deriveKeyFromPassphrase 
} from '@/lib/crypto-utils';

describe('Crypto Utils', () => {
  describe('Random Generation', () => {
    test('getRandomBytes generates correct length', () => {
      const bytes = getRandomBytes(16);
      expect(bytes).toHaveLength(16);
      expect(bytes).toBeInstanceOf(Uint8Array);
    });

    test('getRandomBytes generates different values', () => {
      const bytes1 = getRandomBytes(16);
      const bytes2 = getRandomBytes(16);
      expect(bytes1).not.toEqual(bytes2);
    });

    test('generateRandomHex generates correct length', () => {
      const hex = generateRandomHex(16);
      expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(typeof hex).toBe('string');
      expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
    });
  });

  describe('Format Conversion', () => {
    test('stringToHex converts correctly', () => {
      const str = 'Hello';
      const hex = stringToHex(str);
      expect(hex).toBe('48656c6c6f');
    });

    test('hexToString converts correctly', () => {
      const hex = '48656c6c6f';
      const str = hexToString(hex);
      expect(str).toBe('Hello');
    });

    test('stringToBase64 converts correctly', () => {
      const str = 'Hello';
      const base64 = stringToBase64(str);
      expect(base64).toBe('SGVsbG8=');
    });

    test('base64ToString converts correctly', () => {
      const base64 = 'SGVsbG8=';
      const str = base64ToString(base64);
      expect(str).toBe('Hello');
    });

    test('round trip conversions work', () => {
      const original = 'Hello World! 🌍';
      
      // Test hex round trip
      const hex = stringToHex(original);
      const fromHex = hexToString(hex);
      expect(fromHex).toBe(original);
      
      // Test base64 round trip
      const base64 = stringToBase64(original);
      const fromBase64 = base64ToString(base64);
      expect(fromBase64).toBe(original);
    });
  });

  describe('Validation', () => {
    test('isValidHex accepts valid hex', () => {
      expect(isValidHex('1234abcd')).toBe(true);
      expect(isValidHex('1234ABCD')).toBe(true);
      expect(isValidHex('0123456789abcdef')).toBe(true);
      expect(isValidHex('')).toBe(true); // empty string is valid
    });

    test('isValidHex rejects invalid hex', () => {
      expect(isValidHex('xyz')).toBe(false);
      expect(isValidHex('12g4')).toBe(false);
      expect(isValidHex('123')).toBe(false); // odd length
    });

    test('isValidBase64 accepts valid base64', () => {
      expect(isValidBase64('SGVsbG8=')).toBe(true);
      expect(isValidBase64('SGVsbG8')).toBe(true); // without padding
      expect(isValidBase64('')).toBe(true);
    });

    test('validateKeyLength validates correctly', () => {
      expect(validateKeyLength('1234567890123456', [16], 'text')).toBe(true); // 16 chars
      expect(validateKeyLength('123456789012345678901234', [24], 'text')).toBe(true); // 24 chars
      expect(validateKeyLength('12345678901234567890123456789012', [32], 'text')).toBe(true); // 32 chars
      expect(validateKeyLength('short', [16], 'text')).toBe(false);
      expect(validateKeyLength('12345678901234567890', [16, 24, 32], 'text')).toBe(false);
    });
  });
  describe('Key Derivation', () => {
    test('deriveKeyFromPassphrase generates consistent keys', async () => {
      const passphrase = 'testpassword';
      const salt = 'testsalt';
      const iterations = 10000;
      const keyLength = 32;

      const key1 = await deriveKeyFromPassphrase(passphrase, salt, iterations, keyLength);
      const key2 = await deriveKeyFromPassphrase(passphrase, salt, iterations, keyLength);

      expect(key1).toEqual(key2);
      expect(typeof key1).toBe('string');
    });

    test('deriveKeyFromPassphrase generates different keys for different inputs', async () => {
      const iterations = 10000;
      const keyLength = 32;

      const key1 = await deriveKeyFromPassphrase('password1', 'salt', iterations, keyLength);
      const key2 = await deriveKeyFromPassphrase('password2', 'salt', iterations, keyLength);
      const key3 = await deriveKeyFromPassphrase('password1', 'salt2', iterations, keyLength);

      expect(key1).not.toEqual(key2);
      expect(key1).not.toEqual(key3);
      expect(key2).not.toEqual(key3);
    });

    test('deriveKeyFromPassphrase handles different key lengths', async () => {
      const passphrase = 'testpassword';
      const salt = 'testsalt';
      const iterations = 10000;

      const key16 = await deriveKeyFromPassphrase(passphrase, salt, iterations, 16);
      const key32 = await deriveKeyFromPassphrase(passphrase, salt, iterations, 32);

      expect(key16.length).toBeLessThan(key32.length);
      expect(key16).not.toEqual(key32.slice(0, key16.length));
    });
  });

  describe('Edge Cases', () => {
    test('handles empty inputs gracefully', () => {
      expect(stringToHex('')).toBe('');
      expect(hexToString('')).toBe('');
      expect(stringToBase64('')).toBe('');
      expect(base64ToString('')).toBe('');
    });

    test('handles random generation edge cases', () => {
      const zeroBytes = getRandomBytes(0);
      expect(zeroBytes).toHaveLength(0);
      
      const oneHex = generateRandomHex(1);
      expect(oneHex).toHaveLength(2);
    });
  });
});
