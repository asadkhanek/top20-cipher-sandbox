import FlexSearch from 'flexsearch';
import { CipherMetadata } from '@/types/crypto';

// Extended cipher metadata for search
interface SearchableCipherMetadata extends CipherMetadata {
  searchTerms: string;
}

// FlexSearch index for cipher search
export class CipherSearchEngine {
  private index: FlexSearch.Document<SearchableCipherMetadata>;
  private ciphers: Map<string, CipherMetadata> = new Map();

  constructor() {
    // Create FlexSearch document index with multiple fields
    this.index = new FlexSearch.Document({
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
            field: 'category',
            tokenize: 'strict',
            optimize: true
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
  }

  /**
   * Initialize the search index with cipher data
   */
  initialize(cipherData: CipherMetadata[]): void {
    this.ciphers.clear();
      // Clear existing index
    this.index = new FlexSearch.Document({
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
            field: 'category',
            tokenize: 'strict',
            optimize: true
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

    // Add all ciphers to the index
    cipherData.forEach(cipher => {
      this.addCipher(cipher);
    });
  }

  /**
   * Add a cipher to the search index
   */
  private addCipher(cipher: CipherMetadata): void {
    this.ciphers.set(cipher.id, cipher);
    
    // Create enhanced search terms for better matching
    const searchTerms = [
      cipher.name,
      cipher.description,
      cipher.category,
      cipher.id,
      // Add common abbreviations and alternative names
      ...this.getAlternativeNames(cipher.id),
      // Add performance and complexity terms
      cipher.performance || '',
      cipher.complexity || ''
    ].join(' ');    // Add to FlexSearch index
    this.index.add({
      ...cipher,
      searchTerms
    } as SearchableCipherMetadata);
  }

  /**
   * Get alternative names and abbreviations for better search
   */
  private getAlternativeNames(cipherId: string): string[] {
    const alternatives: Record<string, string[]> = {
      'aes': ['advanced encryption standard', 'rijndael'],
      'rsa': ['rivest shamir adleman'],
      'des': ['data encryption standard'],
      '3des': ['triple des', 'tdea', 'triple data encryption algorithm'],
      'chacha20': ['chacha', 'salsa20 variant'],
      'salsa20': ['salsa', 'chacha20 variant'],
      'ecc': ['elliptic curve cryptography', 'elliptic curve'],
      'kyber': ['crystals kyber', 'quantum resistant'],
      'sphincs': ['sphincs+', 'hash based signature'],
      'blowfish': ['twofish predecessor'],
      'twofish': ['blowfish successor'],
      'rc4': ['rivest cipher 4', 'arcfour'],
      'idea': ['international data encryption algorithm'],
      'cast128': ['cast', 'cast5'],
      'tea': ['tiny encryption algorithm'],
      'xtea': ['extended tea', 'extended tiny encryption algorithm'],
      'serpent': ['aes finalist'],
      'camellia': ['ntt camellia'],
      'seed': ['korean cipher'],
      'aria': ['korean standard']
    };

    return alternatives[cipherId] || [];
  }

  /**
   * Search for ciphers using FlexSearch
   */
  search(query: string, limit = 20): CipherMetadata[] {
    if (!query.trim()) {
      return Array.from(this.ciphers.values());
    }

    try {
      // Perform the search
      const results = this.index.search(query, { limit });
      
      // Extract unique cipher IDs from results
      const cipherIds = new Set<string>();
      results.forEach(result => {
        if (Array.isArray(result.result)) {
          result.result.forEach(id => cipherIds.add(id as string));
        }
      });

      // Convert IDs back to cipher metadata
      const searchResults: CipherMetadata[] = [];
      cipherIds.forEach(id => {
        const cipher = this.ciphers.get(id);
        if (cipher) {
          searchResults.push(cipher);
        }
      });

      // Sort results by relevance (exact matches first, then by name)
      const queryLower = query.toLowerCase();
      return searchResults.sort((a, b) => {
        // Exact ID matches first
        if (a.id.toLowerCase() === queryLower) return -1;
        if (b.id.toLowerCase() === queryLower) return 1;
        
        // Name starts with query
        if (a.name.toLowerCase().startsWith(queryLower)) return -1;
        if (b.name.toLowerCase().startsWith(queryLower)) return 1;
        
        // Alphabetical by name
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple string matching
      return this.fallbackSearch(query);
    }
  }

  /**
   * Fallback search method using simple string matching
   */
  private fallbackSearch(query: string): CipherMetadata[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.ciphers.values()).filter(cipher =>
      cipher.name.toLowerCase().includes(queryLower) ||
      cipher.description.toLowerCase().includes(queryLower) ||
      cipher.id.toLowerCase().includes(queryLower) ||
      cipher.category.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Get search suggestions based on partial input
   */
  getSuggestions(query: string, limit = 5): string[] {
    if (!query.trim()) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Add cipher names that start with the query
    this.ciphers.forEach(cipher => {
      if (cipher.name.toLowerCase().startsWith(queryLower)) {
        suggestions.add(cipher.name);
      }
      if (cipher.id.toLowerCase().startsWith(queryLower)) {
        suggestions.add(cipher.id.toUpperCase());
      }
    });

    // Add category suggestions
    const categories = ['symmetric', 'asymmetric', 'post-quantum'];
    categories.forEach(category => {
      if (category.startsWith(queryLower)) {
        suggestions.add(category);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get the total number of indexed ciphers
   */
  getIndexSize(): number {
    return this.ciphers.size;
  }
}

// Export a singleton instance
export const cipherSearch = new CipherSearchEngine();
