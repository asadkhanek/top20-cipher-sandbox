'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Shield, Lock, Zap, ChevronRight, Filter, Grid, List } from 'lucide-react';
import CipherRegistry from '@/crypto/registry';

export default function CiphersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const allCiphers = CipherRegistry.getAllMetadata();
  
  const filteredCiphers = React.useMemo(() => {
    let ciphers = allCiphers;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      ciphers = CipherRegistry.getByCategory(selectedCategory as any);
    }
      // Filter by search query
    if (searchQuery) {
      ciphers = ciphers.filter(cipher => 
        cipher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cipher.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cipher.keyRequirements.keySizes.some(size => size.toString().includes(searchQuery)) ||
        cipher.variants.some(variant => variant.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return ciphers;
  }, [searchQuery, selectedCategory, allCiphers]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'symmetric':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'asymmetric':
        return <Lock className="w-4 h-4 text-amber-600" />;
      case 'post-quantum':
        return <Zap className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'symmetric':
        return 'cipher-category-symmetric';
      case 'asymmetric':
        return 'cipher-category-asymmetric';
      case 'post-quantum':
        return 'cipher-category-post-quantum';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const categories = [
    { id: 'all', name: 'All Ciphers', count: allCiphers.length },
    { id: 'symmetric', name: 'Symmetric', count: CipherRegistry.getByCategory('symmetric').length },
    { id: 'asymmetric', name: 'Asymmetric', count: CipherRegistry.getByCategory('asymmetric').length },
    { id: 'post-quantum', name: 'Post-Quantum', count: CipherRegistry.getByCategory('post-quantum').length },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          All Cryptographic Algorithms
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our complete collection of {allCiphers.length} encryption algorithms. 
          From classical ciphers to modern post-quantum cryptography.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search ciphers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input min-w-[150px]"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-3 rounded-lg border transition-colors text-left ${
                selectedCategory === category.id
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-semibold text-lg">{category.count}</div>
              <div className="text-sm opacity-75">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {searchQuery ? `Search Results (${filteredCiphers.length})` : 
             selectedCategory === 'all' ? `All Ciphers (${filteredCiphers.length})` :
             `${categories.find(c => c.id === selectedCategory)?.name} Ciphers (${filteredCiphers.length})`}
          </h2>
        </div>

        {filteredCiphers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchQuery 
                ? `No ciphers found matching "${searchQuery}"` 
                : 'No ciphers found for the selected category'
              }
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCiphers.map((cipher) => (
              <Link
                key={cipher.id}
                href={`/cipher/${cipher.id}`}
                className="card hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(cipher.category)}
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {cipher.name}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {cipher.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryBadgeClass(cipher.category)}`}>
                      {cipher.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${
                        cipher.performance === 'fast' ? 'bg-green-500' :
                        cipher.performance === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      {cipher.performance}
                    </div>
                  </div>
                    <div className="text-xs text-gray-500 space-y-1">
                    <div>Key: {cipher.keyRequirements.keySizes.join(', ')} bits</div>
                    {cipher.ivSize && <div>IV: {cipher.ivSize} bits</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCiphers.map((cipher) => (
              <Link
                key={cipher.id}
                href={`/cipher/${cipher.id}`}
                className="card hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getCategoryIcon(cipher.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {cipher.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryBadgeClass(cipher.category)}`}>
                        {cipher.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {cipher.description}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className={`w-2 h-2 rounded-full ${
                        cipher.performance === 'fast' ? 'bg-green-500' :
                        cipher.performance === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      {cipher.performance}
                    </div>                    <div className="text-xs text-gray-500">
                      {cipher.keyRequirements.keySizes.join('/')} bit key
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors mt-1 ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
