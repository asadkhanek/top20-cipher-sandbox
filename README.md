# Top 20 Cipher Sandbox

A comprehensive interactive cryptography playground built with Next.js, TypeScript, and Tailwind CSS. Explore, learn, and experiment with 20 different encryption algorithms across symmetric, asymmetric, and post-quantum cryptography.

## 🚀 Features

- **20 Cipher Implementations**: Comprehensive collection including AES, RSA, ChaCha20, Kyber, and more
- **Interactive Sandbox**: Real-time encrypt/decrypt with visual feedback
- **Advanced Search**: FlexSearch-powered fuzzy search with intelligent suggestions
- **Educational Content**: Detailed specifications, security notes, and usage guidelines
- **Copy-to-Clipboard**: Enhanced clipboard functionality with visual feedback
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Testing Suite**: Unit tests with Jest and E2E tests with Playwright
- **Performance Optimized**: Client-side rendering with Next.js optimizations

## 📚 Supported Ciphers

### Symmetric Ciphers
- **AES** (Advanced Encryption Standard) - 128/192/256-bit
- **ChaCha20** - Stream cipher with Poly1305 authentication
- **DES** - Data Encryption Standard (educational purposes)
- **3DES** - Triple DES encryption
- **Blowfish** - Variable-length key block cipher
- **Twofish** - AES finalist with 128/192/256-bit keys
- **Serpent** - AES finalist with multiple rounds
- **Camellia** - Japanese standard block cipher
- **CAST-128** - 64-bit block cipher
- **IDEA** - International Data Encryption Algorithm
- **Salsa20** - High-speed stream cipher
- **TEA** - Tiny Encryption Algorithm
- **XTEA** - Extended TEA with improved security
- **RC4** - Stream cipher (deprecated, educational only)
- **SEED** - Korean national standard
- **ARIA** - Korean standard block cipher

### Asymmetric Ciphers
- **RSA** - Rivest-Shamir-Adleman with multiple key sizes
- **ECC** - Elliptic Curve Cryptography (P-256/P-384/P-521)

### Post-Quantum Ciphers
- **Kyber** - CRYSTALS-Kyber key encapsulation mechanism
- **SPHINCS+** - Hash-based digital signature scheme

## 🛠 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/top20-cipher-sandbox.git
cd top20-cipher-sandbox

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🧪 Testing

The project includes comprehensive testing with Jest and Playwright:

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 🏗 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Homepage with search and featured ciphers
│   ├── ciphers/           # All ciphers listing page
│   └── cipher/[id]/       # Individual cipher detail pages
├── components/            # React components
│   ├── Sandbox.tsx        # Interactive crypto sandbox
│   └── ClientSandbox.tsx  # Client-side wrapper
├── crypto/               # Cryptography implementations
│   ├── registry.ts       # Cipher registry and management
│   └── engines/          # Individual cipher engines
├── lib/                  # Utility libraries
│   ├── crypto-utils.ts   # Cryptographic utilities
│   └── search.ts         # FlexSearch implementation
├── types/                # TypeScript type definitions
│   └── crypto.ts         # Cryptography-related types
└── __tests__/           # Unit tests
content/
└── ciphers/             # Cipher metadata JSON files
tests/
└── e2e/                 # End-to-end tests
```

## 🔧 Architecture

### Cipher Engine System
Each cipher is implemented as a standardized engine with:
- **Metadata**: Name, category, key requirements, security notes
- **Key Generation**: Secure random key/IV/nonce generation
- **Encrypt/Decrypt**: Unified interface for all operations
- **Error Handling**: Comprehensive error reporting
- **Validation**: Input validation and sanitization

### Search System
- **FlexSearch Integration**: Fast, fuzzy search with ranking
- **Multi-field Indexing**: Search across names, descriptions, categories
- **Alternative Names**: Handles abbreviations and common variants
- **Suggestions**: Real-time search suggestions and autocomplete

### State Management
- **React Hooks**: useState and useEffect for component state
- **Type Safety**: Full TypeScript coverage with strict typing
- **Error Boundaries**: Graceful error handling and recovery

## 🔒 Security Considerations

⚠️ **Educational Purpose Only**: This application is designed for learning and experimentation. Do not use for production cryptographic needs.

### Security Features
- **Secure Random Generation**: Uses Web Crypto API for entropy
- **Input Validation**: Comprehensive validation for all inputs
- **Error Handling**: Safe error messages without sensitive data leakage
- **Type Safety**: Runtime type checking and validation

### Security Notes
- Keys are generated client-side and never transmitted
- All cryptographic operations occur in the browser
- No persistent storage of sensitive data
- Deprecated ciphers are clearly marked as educational only

## 🎯 Usage Examples

### Basic Encryption
1. Select a cipher (e.g., AES-256)
2. Generate or enter a key
3. Enter plaintext
4. Click "Encrypt"
5. Copy the resulting ciphertext

### Advanced Features
- **Mode Selection**: Choose from ECB, CBC, GCM, etc.
- **Key Derivation**: PBKDF2 support for password-based encryption
- **Format Conversion**: Automatic hex/base64/text conversion
- **Error Diagnosis**: Detailed error messages and suggestions

## 🚀 Deployment

### GitHub Pages
The project is configured for deployment to GitHub Pages:

```bash
# Build static export
npm run build

# Deploy to GitHub Pages (automated via GitHub Actions)
git push origin main
```

### Environment Variables
No environment variables are required for basic functionality.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-cipher`
3. Implement your changes with tests
4. Ensure all tests pass: `npm test`
5. Submit a pull request

### Adding New Ciphers
1. Create cipher engine in `src/crypto/engines/`
2. Add metadata JSON in `content/ciphers/`
3. Register in `src/crypto/registry.ts`
4. Add comprehensive tests
5. Update documentation

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the excellent React framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Web Crypto API**: For secure cryptographic primitives
- **Cryptography Community**: For the educational resources and standards

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/top20-cipher-sandbox/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/top20-cipher-sandbox/discussions)
- **Documentation**: [Developer Guide](DEVELOPER.md)

---

Built with ❤️ for the cryptography learning community.
