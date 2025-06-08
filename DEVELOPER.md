# Developer Guide

This guide provides comprehensive technical documentation for developers working on the Top 20 Cipher Sandbox project.

## 🏗 Architecture Overview

### System Design
The application follows a modular, type-safe architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│     Layer       │    │     Logic       │    │     Layer       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ React Components│───▶│ Cipher Engines  │───▶│ Metadata JSON   │
│ Next.js Pages   │    │ Crypto Utils    │    │ TypeScript Types│
│ Tailwind CSS    │    │ Search Engine   │    │ Registry System │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Principles
- **Type Safety**: Full TypeScript coverage with strict mode
- **Modularity**: Self-contained cipher engines with standardized interfaces
- **Performance**: Client-side processing with optimized search
- **Security**: Secure-by-default with comprehensive validation
- **Testability**: High test coverage with unit and E2E tests

## 🔧 Technical Stack

### Frontend Framework
- **Next.js 15.3.3**: React framework with App Router
- **React 18.3.1**: UI library with modern hooks
- **TypeScript 5.x**: Type-safe JavaScript with strict mode

### Styling & UI
- **Tailwind CSS 3.x**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Custom CSS Variables**: Theme system with CSS custom properties

### Cryptography Libraries
- **Web Crypto API**: Native browser cryptographic functions
- **crypto-js**: JavaScript cryptography library
- **node-forge**: TLS and crypto implementations
- **elliptic**: Elliptic curve cryptography
- **tweetnacl**: High-security crypto library

### Search & Performance
- **FlexSearch**: Fast full-text search engine
- **Dynamic Imports**: Code splitting for optimal performance
- **Client-side Processing**: No server dependencies

### Testing Framework
- **Jest**: Unit testing framework
- **React Testing Library**: React component testing
- **Playwright**: End-to-end testing
- **TypeScript**: Compile-time type checking

## 📁 File Structure Details

### `/src/app/` - Next.js App Router
```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Homepage with search and featured ciphers
├── globals.css         # Global styles and CSS variables
├── ciphers/
│   └── page.tsx        # All ciphers listing with filters
└── cipher/
    └── [id]/
        └── page.tsx    # Individual cipher detail page
```

### `/src/components/` - React Components
```
components/
├── Sandbox.tsx         # Main interactive cryptography sandbox
└── ClientSandbox.tsx   # Client-side wrapper for SSR compatibility
```

### `/src/crypto/` - Cryptography System
```
crypto/
├── registry.ts         # Central cipher registry and management
└── engines/           # Individual cipher implementations
    ├── aes.ts         # AES implementation
    ├── rsa.ts         # RSA implementation
    ├── chacha20.ts    # ChaCha20 implementation
    └── ...            # 17 more cipher engines
```

### `/src/lib/` - Utility Libraries
```
lib/
├── crypto-utils.ts     # Cryptographic utility functions
└── search.ts          # FlexSearch implementation and configuration
```

### `/src/types/` - TypeScript Definitions
```
types/
└── crypto.ts          # All cryptography-related type definitions
```

## 🔐 Cipher Engine Interface

### Engine Structure
Each cipher engine implements the `CipherEngine` interface:

```typescript
interface CipherEngine {
  readonly metadata: CipherMetadata;
  
  generateKey(keySize: number): Promise<string>;
  generateIV?(): Promise<string>;
  generateNonce?(): Promise<string>;
  
  encrypt(params: EncryptionParams): Promise<CryptoOperation>;
  decrypt(params: DecryptionParams): Promise<CryptoOperation>;
}
```

### Implementation Guidelines

#### 1. Metadata Definition
```typescript
const metadata: CipherMetadata = {
  id: 'cipher-id',
  name: 'Cipher Name',
  category: 'symmetric' | 'asymmetric' | 'post-quantum',
  description: 'Brief description',
  keyRequirements: {
    minKeySize: 16,
    maxKeySize: 32,
    keyMultiple: 8
  },
  modes: ['ECB', 'CBC', 'GCM'],
  variants: [
    { id: '128', name: 'AES-128', keySize: 16 },
    { id: '256', name: 'AES-256', keySize: 32 }
  ],
  ivRequired: true,
  ivSize: 16,
  nonceRequired: false,
  strengths: ['Fast', 'Secure', 'Standard'],
  weaknesses: ['Quantum vulnerable'],
  useCases: ['Data encryption', 'Communication'],
  securityNotes: [
    {
      level: 'info',
      message: 'AES is the current encryption standard'
    }
  ]
};
```

#### 2. Key Generation
```typescript
async generateKey(keySize: number): Promise<string> {
  const key = new Uint8Array(keySize);
  crypto.getRandomValues(key);
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

#### 3. Encryption Implementation
```typescript
async encrypt(params: EncryptionParams): Promise<CryptoOperation> {
  try {
    // Validate inputs
    if (!this.validateInputs(params)) {
      return {
        success: false,
        error: 'Invalid parameters'
      };
    }
    
    // Perform encryption
    const result = await this.performEncryption(params);
    
    return {
      success: true,
      result: result,
      metadata: {
        keyLength: params.key.length / 2,
        mode: params.mode,
        variant: params.variant
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

#### 4. Error Handling
```typescript
private validateInputs(params: EncryptionParams): boolean {
  // Key validation
  if (!params.key || !/^[0-9a-fA-F]+$/.test(params.key)) {
    throw new Error('Invalid key format');
  }
  
  // Length validation
  const expectedKeySize = this.getKeySize(params.variant);
  if (params.key.length / 2 !== expectedKeySize) {
    throw new Error(`Key must be ${expectedKeySize} bytes`);
  }
  
  return true;
}
```

## 🔍 Search System Implementation

### FlexSearch Configuration
```typescript
const searchEngine = new FlexSearch.Document({
  document: {
    id: 'id',
    index: [
      {
        field: 'name',
        tokenize: 'forward',
        optimize: true,
        resolution: 5
      },
      {
        field: 'description',
        tokenize: 'forward',
        optimize: true,
        resolution: 3
      },
      {
        field: 'searchTerms',
        tokenize: 'forward',
        optimize: true,
        resolution: 2
      }
    ]
  }
});
```

### Search Enhancement Features
- **Fuzzy Matching**: Handles typos and partial matches
- **Ranking Algorithm**: Prioritizes exact matches and relevance
- **Alternative Names**: Supports abbreviations and synonyms
- **Category Filtering**: Efficient category-based searches
- **Real-time Suggestions**: Auto-complete functionality

## 🧪 Testing Strategy

### Unit Testing with Jest
```typescript
// Example cipher engine test
describe('AESEngine', () => {
  let engine: AESEngine;
  
  beforeEach(() => {
    engine = new AESEngine();
  });
  
  test('should generate valid key', async () => {
    const key = await engine.generateKey(32);
    expect(key).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(key).toMatch(/^[0-9a-fA-F]+$/);
  });
  
  test('should encrypt and decrypt successfully', async () => {
    const plaintext = 'Hello, World!';
    const key = await engine.generateKey(32);
    const iv = await engine.generateIV();
    
    const encrypted = await engine.encrypt({
      plaintext,
      key,
      iv,
      mode: 'CBC',
      variant: '256'
    });
    
    expect(encrypted.success).toBe(true);
    
    const decrypted = await engine.decrypt({
      ciphertext: encrypted.result!,
      key,
      iv,
      mode: 'CBC',
      variant: '256'
    });
    
    expect(decrypted.success).toBe(true);
    expect(decrypted.result).toBe(plaintext);
  });
});
```

### E2E Testing with Playwright
```typescript
// Example E2E test
test('should encrypt and decrypt with AES', async ({ page }) => {
  await page.goto('/cipher/aes');
  
  // Generate key
  await page.click('[title="Generate Random Key"]');
  
  // Enter plaintext
  await page.fill('textarea[placeholder*="Enter your message"]', 'Test message');
  
  // Encrypt
  await page.click('button:has-text("Encrypt")');
  
  // Verify ciphertext appears
  const ciphertext = await page.locator('textarea[placeholder*="Ciphertext"]').inputValue();
  expect(ciphertext).toBeTruthy();
  
  // Decrypt
  await page.click('button:has-text("Decrypt")');
  
  // Verify original plaintext
  const decryptedText = await page.locator('textarea[placeholder*="Enter your message"]').inputValue();
  expect(decryptedText).toBe('Test message');
});
```

## 🎨 Styling System

### Tailwind CSS Configuration
```typescript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: ['@tailwindcss/forms', '@tailwindcss/typography']
};
```

### CSS Custom Properties
```css
/* globals.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --shadow-soft: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --border-radius: 0.5rem;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}

.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}
```

## 🚀 Performance Optimizations

### Code Splitting
```typescript
// Dynamic imports for cipher engines
const loadCipherEngine = async (cipherId: string) => {
  const { default: engine } = await import(`./engines/${cipherId}`);
  return engine;
};
```

### Search Optimization
```typescript
// Debounced search to reduce computation
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setSearchResults(cipherSearch.search(query));
  }, 300),
  []
);
```

### Memory Management
```typescript
// Cleanup search index when component unmounts
useEffect(() => {
  return () => {
    searchEngine.destroy();
  };
}, []);
```

## 🔒 Security Best Practices

### Input Validation
```typescript
const validateHexInput = (input: string): boolean => {
  return /^[0-9a-fA-F]*$/.test(input.replace(/\s/g, ''));
};

const sanitizeInput = (input: string): string => {
  return input.replace(/[^0-9a-fA-F\s]/g, '');
};
```

### Error Handling
```typescript
// Safe error messages without sensitive data exposure
const createSafeError = (error: unknown): string => {
  if (error instanceof Error) {
    // Only return known safe error messages
    const safeMessages = [
      'Invalid key length',
      'Invalid input format',
      'Encryption failed',
      'Decryption failed'
    ];
    
    const message = error.message;
    return safeMessages.includes(message) ? message : 'Operation failed';
  }
  
  return 'Unknown error occurred';
};
```

### Key Management
```typescript
// Secure key generation using Web Crypto API
const generateSecureKey = async (size: number): Promise<Uint8Array> => {
  const key = new Uint8Array(size);
  
  if (crypto && crypto.getRandomValues) {
    crypto.getRandomValues(key);
  } else {
    throw new Error('Secure random generation not available');
  }
  
  return key;
};
```

## 📦 Build & Deployment

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Production Build
```bash
# Build for production
npm run build

# Test production build locally
npm start

# Generate static export (for GitHub Pages)
npm run export
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm test
      - run: npm run test:e2e
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

## 🐛 Debugging Guide

### Common Issues

#### 1. Cipher Engine Not Loading
```typescript
// Check if engine is registered
const engine = CipherRegistry.getEngine('cipher-id');
if (!engine) {
  console.error('Cipher engine not found. Check registration in registry.ts');
}
```

#### 2. Search Not Working
```typescript
// Check if search index is initialized
const searchSize = cipherSearch.getIndexSize();
if (searchSize === 0) {
  console.error('Search index not initialized. Call cipherSearch.initialize()');
}
```

#### 3. Crypto Operations Failing
```typescript
// Enable debug logging
const debugCrypto = (operation: string, params: any) => {
  console.group(`Crypto Debug: ${operation}`);
  console.log('Parameters:', params);
  console.log('Browser Crypto Support:', !!window.crypto);
  console.groupEnd();
};
```

### Development Tools
- **React DevTools**: Component inspection and profiling
- **Next.js DevTools**: Build analysis and performance insights
- **Browser DevTools**: Network, Performance, and Security tabs
- **TypeScript Language Server**: Real-time type checking

## 🤝 Contributing Guidelines

### Code Style
- Use TypeScript with strict mode enabled
- Follow ESLint and Prettier configurations
- Write comprehensive JSDoc comments
- Maintain 80%+ test coverage

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Run full test suite
5. Submit PR with detailed description

### Adding New Ciphers
1. Create engine class implementing `CipherEngine`
2. Add metadata JSON file
3. Register in `registry.ts`
4. Write comprehensive tests
5. Update documentation and examples

---

For more specific questions, please refer to the inline code documentation or open an issue on GitHub.
