import { CipherEngine, CipherMetadata } from '@/types/crypto';
import { cipherSearch } from '@/lib/search';
import AESEngine from './engines/aes';
import ChaCha20Engine from './engines/chacha20';
import { RSAEngine } from './engines/rsa';
import { DESEngine } from './engines/des';
import { TripleDESEngine } from './engines/3des';
import { BlowfishEngine } from './engines/blowfish';
import { RC4Engine } from './engines/rc4';
import { TwofishEngine } from './engines/twofish';
import { SerpentEngine } from './engines/serpent';
import { CamelliaEngine } from './engines/camellia';
import { Cast128Engine } from './engines/cast128';
import { IdeaEngine } from './engines/idea';
import { Salsa20Engine } from './engines/salsa20';
import { TeaEngine } from './engines/tea';
import { XteaEngine } from './engines/xtea';
import { EccEngine } from './engines/ecc';
import { SeedEngine } from './engines/seed';
import { AriaEngine } from './engines/aria';
import { KyberEngine } from './engines/kyber';
import { SphincsEngine } from './engines/sphincs';

// Registry of all available cipher engines
export class CipherRegistry {
  private static engines: Map<string, CipherEngine> = new Map();
  private static metadata: Map<string, CipherMetadata> = new Map();
  private static initialized = false;

  static {
    // Register all cipher engines
    this.register(new AESEngine());
    this.register(new ChaCha20Engine());
    this.register(new RSAEngine());
    this.register(new DESEngine());
    this.register(new TripleDESEngine());
    this.register(new BlowfishEngine());
    this.register(new RC4Engine());
    this.register(new TwofishEngine());
    this.register(new SerpentEngine());
    this.register(new CamelliaEngine());
    this.register(new Cast128Engine());
    this.register(new IdeaEngine());
    this.register(new Salsa20Engine());
    this.register(new TeaEngine());
    this.register(new XteaEngine());
    this.register(new EccEngine());    this.register(new SeedEngine());
    this.register(new AriaEngine());
    this.register(new KyberEngine());
    this.register(new SphincsEngine());
    
    // Initialize search index
    this.initializeSearch();
  }
  /**
   * Initialize the search index with all cipher metadata
   */
  private static initializeSearch(): void {
    if (!this.initialized) {
      cipherSearch.initialize(this.getAllMetadata());
      this.initialized = true;
    }
  }

  /**
   * Register a cipher engine
   */
  private static register(engine: CipherEngine): void {
    this.engines.set(engine.metadata.id, engine);
    this.metadata.set(engine.metadata.id, engine.metadata);
  }

  /**
   * Get a cipher engine by ID
   */
  static getEngine(id: string): CipherEngine | undefined {
    return this.engines.get(id);
  }

  /**
   * Get cipher metadata by ID
   */
  static getMetadata(id: string): CipherMetadata | undefined {
    return this.metadata.get(id);
  }

  /**
   * Get all available cipher metadata
   */
  static getAllMetadata(): CipherMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Get ciphers by category
   */
  static getByCategory(category: string): CipherMetadata[] {
    return this.getAllMetadata().filter(cipher => cipher.category === category);
  }
  /**
   * Search ciphers using FlexSearch with fuzzy matching and ranking
   */
  static search(query: string): CipherMetadata[] {
    this.initializeSearch();
    return cipherSearch.search(query);
  }

  /**
   * Get search suggestions for autocomplete
   */
  static getSuggestions(query: string): string[] {
    this.initializeSearch();
    return cipherSearch.getSuggestions(query);
  }

  /**
   * Fallback search method using simple string matching
   */
  static simpleSearch(query: string): CipherMetadata[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllMetadata().filter(cipher => 
      cipher.name.toLowerCase().includes(lowercaseQuery) ||
      cipher.description.toLowerCase().includes(lowercaseQuery) ||
      cipher.id.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Check if a cipher exists
   */
  static exists(id: string): boolean {
    return this.engines.has(id);
  }

  /**
   * Get all cipher IDs
   */
  static getAllIds(): string[] {
    return Array.from(this.engines.keys());
  }
}

export default CipherRegistry;
