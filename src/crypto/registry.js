var _a;
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
    /**
     * Initialize the search index with all cipher metadata
     */
    static initializeSearch() {
        if (!this.initialized) {
            cipherSearch.initialize(this.getAllMetadata());
            this.initialized = true;
        }
    }
    /**
     * Register a cipher engine
     */
    static register(engine) {
        this.engines.set(engine.metadata.id, engine);
        this.metadata.set(engine.metadata.id, engine.metadata);
    }
    /**
     * Get a cipher engine by ID
     */
    static getEngine(id) {
        return this.engines.get(id);
    }
    /**
     * Get cipher metadata by ID
     */
    static getMetadata(id) {
        return this.metadata.get(id);
    }
    /**
     * Get all available cipher metadata
     */
    static getAllMetadata() {
        return Array.from(this.metadata.values());
    }
    /**
     * Get ciphers by category
     */
    static getByCategory(category) {
        return this.getAllMetadata().filter(cipher => cipher.category === category);
    }
    /**
     * Search ciphers using FlexSearch with fuzzy matching and ranking
     */
    static search(query) {
        this.initializeSearch();
        return cipherSearch.search(query);
    }
    /**
     * Get search suggestions for autocomplete
     */
    static getSuggestions(query) {
        this.initializeSearch();
        return cipherSearch.getSuggestions(query);
    }
    /**
     * Fallback search method using simple string matching
     */
    static simpleSearch(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.getAllMetadata().filter(cipher => cipher.name.toLowerCase().includes(lowercaseQuery) ||
            cipher.description.toLowerCase().includes(lowercaseQuery) ||
            cipher.id.toLowerCase().includes(lowercaseQuery));
    }
    /**
     * Check if a cipher exists
     */
    static exists(id) {
        return this.engines.has(id);
    }
    /**
     * Get all cipher IDs
     */
    static getAllIds() {
        return Array.from(this.engines.keys());
    }
}
_a = CipherRegistry;
CipherRegistry.engines = new Map();
CipherRegistry.metadata = new Map();
CipherRegistry.initialized = false;
(() => {
    // Register all cipher engines
    _a.register(new AESEngine());
    _a.register(new ChaCha20Engine());
    _a.register(new RSAEngine());
    _a.register(new DESEngine());
    _a.register(new TripleDESEngine());
    _a.register(new BlowfishEngine());
    _a.register(new RC4Engine());
    _a.register(new TwofishEngine());
    _a.register(new SerpentEngine());
    _a.register(new CamelliaEngine());
    _a.register(new Cast128Engine());
    _a.register(new IdeaEngine());
    _a.register(new Salsa20Engine());
    _a.register(new TeaEngine());
    _a.register(new XteaEngine());
    _a.register(new EccEngine());
    _a.register(new SeedEngine());
    _a.register(new AriaEngine());
    _a.register(new KyberEngine());
    _a.register(new SphincsEngine());
    // Initialize search index
    _a.initializeSearch();
})();
export default CipherRegistry;
