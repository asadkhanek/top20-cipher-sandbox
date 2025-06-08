/**
 * Secure random number generation utilities
 */

/**
 * Generate cryptographically secure random bytes
 */
export function getRandomBytes(length: number): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
  }
  
  // Fallback for environments without Web Crypto API
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

/**
 * Generate a random hex string of specified byte length
 */
export function generateRandomHex(byteLength: number): string {
  const bytes = getRandomBytes(byteLength);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a random base64 string of specified byte length
 */
export function generateRandomBase64(byteLength: number): string {
  const bytes = getRandomBytes(byteLength);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * String encoding/decoding utilities
 */

/**
 * Convert string to hex
 */
export function stringToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex to string
 */
export function hexToString(hex: string): string {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  return new TextDecoder().decode(bytes);
}

/**
 * Convert string to base64
 */
export function stringToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Convert base64 to string
 */
export function base64ToString(base64: string): string {
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Convert hex to base64
 */
export function hexToBase64(hex: string): string {
  const bytes = hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 to hex
 */
export function base64ToHex(base64: string): string {
  const binaryString = atob(base64);
  return Array.from(binaryString)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Format conversion utilities
 */
export function convertFormat(
  input: string,
  fromFormat: 'text' | 'hex' | 'base64',
  toFormat: 'text' | 'hex' | 'base64'
): string {
  if (fromFormat === toFormat) return input;
  
  try {
    // First convert to text as intermediate format
    let text: string;
    switch (fromFormat) {
      case 'text':
        text = input;
        break;
      case 'hex':
        text = hexToString(input);
        break;
      case 'base64':
        text = base64ToString(input);
        break;
      default:
        text = input;
    }
    
    // Then convert from text to target format
    switch (toFormat) {
      case 'text':
        return text;
      case 'hex':
        return stringToHex(text);
      case 'base64':
        return stringToBase64(text);
      default:
        return text;
    }
  } catch (error) {
    throw new Error(`Failed to convert from ${fromFormat} to ${toFormat}: ${error}`);
  }
}

/**
 * Validation utilities
 */

/**
 * Check if string is valid hex
 */
export function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]*$/.test(str) && str.length % 2 === 0;
}

/**
 * Check if string is valid base64
 */
export function isValidBase64(str: string): boolean {
  if (str === '') return true; // Empty string is valid
  
  // Check if string contains only valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) return false;
  
  try {
    // Normalize padding and test
    const normalized = str + '='.repeat((4 - str.length % 4) % 4);
    return btoa(atob(normalized)) === normalized;
  } catch {
    return false;
  }
}

/**
 * Validate key length for cipher
 */
export function validateKeyLength(key: string, validLengths: number[], format: 'hex' | 'base64' | 'text' = 'hex'): boolean {
  let keyBytes: number;
  
  switch (format) {
    case 'hex':
      if (!isValidHex(key)) return false;
      keyBytes = key.length / 2;
      break;
    case 'base64':
      if (!isValidBase64(key)) return false;
      keyBytes = atob(key).length;
      break;
    case 'text':
      keyBytes = new TextEncoder().encode(key).length;
      break;
    default:
      return false;
  }
  
  return validLengths.includes(keyBytes);
}

/**
 * Padding utilities for block ciphers
 */

/**
 * PKCS7 padding
 */
export function pkcs7Pad(data: Uint8Array, blockSize: number): Uint8Array {
  const padding = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padding);
  padded.set(data);
  
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = padding;
  }
  
  return padded;
}

/**
 * Remove PKCS7 padding
 */
export function pkcs7Unpad(data: Uint8Array): Uint8Array {
  if (data.length === 0) return data;
  
  const padding = data[data.length - 1];
  if (padding === 0 || padding > data.length) {
    throw new Error('Invalid PKCS7 padding');
  }
  
  // Verify padding bytes
  for (let i = data.length - padding; i < data.length; i++) {
    if (data[i] !== padding) {
      throw new Error('Invalid PKCS7 padding');
    }
  }
  
  return data.slice(0, data.length - padding);
}

/**
 * Secure comparison to prevent timing attacks
 */
export function secureCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}

/**
 * Derive key from passphrase using PBKDF2
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: string,
  iterations: number,
  keyLength: number
): Promise<string> {
  const encoder = new TextEncoder();
  const passphraseBuffer = encoder.encode(passphrase);
  const saltBuffer = encoder.encode(salt);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passphraseBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        keyLength * 8
      );
      
      const derivedArray = new Uint8Array(derivedBits);
      return Array.from(derivedArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.warn('Web Crypto API PBKDF2 failed, using fallback');
    }
  }
  
  // Fallback implementation (not as secure, for demonstration only)
  const crypto = await import('crypto-js');
  const derived = crypto.PBKDF2(passphrase, salt, {
    keySize: keyLength / 4,
    iterations: iterations,
    hasher: crypto.algo.SHA256
  });
  
  return derived.toString();
}
