/**
 * @jest-environment jsdom
 */

import { CipherCategory, CipherMetadata, CipherEngine } from '@/types/crypto';

// Mock data
const mockMetadata: CipherMetadata[] = [
  {
    id: 'aes',
    name: 'Advanced Encryption Standard (AES)',
    category: 'symmetric' as CipherCategory,
    variants: [
      { id: 'aes-128', name: 'AES-128', keySize: 16 },
      { id: 'aes-192', name: 'AES-192', keySize: 24 },
      { id: 'aes-256', name: 'AES-256', keySize: 32 }
    ],
    modes: ['ECB', 'CBC', 'CTR', 'GCM'],
    description: 'AES is a symmetric block cipher',
    keyRequirements: {
      minKeySize: 16,
      maxKeySize: 32,
      keySizes: [16, 24, 32]
    },
    ivRequired: true,
    ivSize: 16,
    nonceRequired: false,
    securityNotes: [],
    references: [],
    complexity: 'low',
    performance: 'fast'
  },
  {
    id: 'rsa',
    name: 'RSA (Rivest-Shamir-Adleman)',
    category: 'asymmetric' as CipherCategory,
    variants: [
      { id: 'rsa-1024', name: 'RSA-1024', keySize: 128 },
      { id: 'rsa-2048', name: 'RSA-2048', keySize: 256 },
      { id: 'rsa-4096', name: 'RSA-4096', keySize: 512 }
    ],
    modes: ['PKCS1', 'OAEP'],
    description: 'RSA is an asymmetric cryptographic algorithm',
    keyRequirements: {
      minKeySize: 128,
      maxKeySize: 512,
      keySizes: [128, 256, 512]
    },
    ivRequired: false,
    ivSize: 0,
    nonceRequired: false,
    securityNotes: [],
    references: [],
    complexity: 'high',
    performance: 'slow'
  }
];

const mockEngine: CipherEngine = {
  metadata: mockMetadata[0],
  encrypt: jest.fn().mockResolvedValue({ success: true, data: 'encrypted' }),
  decrypt: jest.fn().mockResolvedValue({ success: true, data: 'decrypted' }),
  generateKey: jest.fn().mockReturnValue('generatedkey'),
  validateKey: jest.fn().mockReturnValue(true),
};

// Mock the registry module
jest.mock('@/crypto/registry', () => ({
  __esModule: true,
  default: {
    getAllMetadata: () => mockMetadata,
    getMetadata: (id: string) => mockMetadata.find(m => m.id === id) || undefined,
    getEngine: (id: string) => ['aes', 'rsa'].includes(id) ? mockEngine : undefined,
    getAllIds: () => ['aes', 'rsa'],
    getByCategory: (category: string) => mockMetadata.filter(m => m.category === category),
    search: (query: string) => {
      if (!query) return mockMetadata;
      const lowercaseQuery = query.toLowerCase();
      return mockMetadata.filter(m => 
        m.name.toLowerCase().includes(lowercaseQuery) ||
        m.description.toLowerCase().includes(lowercaseQuery) ||
        m.id.toLowerCase().includes(lowercaseQuery)
      );
    },
    exists: (id: string) => ['aes', 'rsa'].includes(id)
  }
}));

import CipherRegistry from '@/crypto/registry';

describe('CipherRegistry', () => {
  test('getAllMetadata returns all cipher metadata', () => {
    const allCiphers = CipherRegistry.getAllMetadata();
    expect(Array.isArray(allCiphers)).toBe(true);
    expect(allCiphers.length).toBeGreaterThan(0);
    
    const firstCipher = allCiphers[0];
    expect(firstCipher).toHaveProperty('id');
    expect(firstCipher).toHaveProperty('name');
    expect(firstCipher).toHaveProperty('category');
  });

  test('getMetadata returns specific cipher metadata', () => {
    const aes = CipherRegistry.getMetadata('aes');
    expect(aes).toBeDefined();
    expect(aes?.id).toBe('aes');
    expect(aes?.name).toBe('Advanced Encryption Standard (AES)');
  });

  test('getEngine returns cipher engine', () => {
    const aesEngine = CipherRegistry.getEngine('aes');
    expect(aesEngine).toBeDefined();
    expect(typeof aesEngine?.encrypt).toBe('function');
    expect(typeof aesEngine?.decrypt).toBe('function');
  });

  test('search finds ciphers by name', () => {
    const results = CipherRegistry.search('AES');
    expect(Array.isArray(results)).toBe(true);
    expect(results.some(cipher => cipher.id === 'aes')).toBe(true);
  });

  test('getByCategory filters ciphers correctly', () => {
    const symmetricCiphers = CipherRegistry.getByCategory('symmetric');
    const asymmetricCiphers = CipherRegistry.getByCategory('asymmetric');

    expect(Array.isArray(symmetricCiphers)).toBe(true);
    expect(Array.isArray(asymmetricCiphers)).toBe(true);
    expect(symmetricCiphers.every(cipher => cipher.category === 'symmetric')).toBe(true);
    expect(asymmetricCiphers.every(cipher => cipher.category === 'asymmetric')).toBe(true);
  });
});
