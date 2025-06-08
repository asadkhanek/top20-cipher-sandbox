'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Shield, Zap, Lock, ChevronRight, Star } from 'lucide-react';
import CipherRegistry from '@/crypto/registry';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const allCiphers = CipherRegistry.getAllMetadata();
  const symmetricCiphers = CipherRegistry.getByCategory('symmetric');
  const asymmetricCiphers = CipherRegistry.getByCategory('asymmetric');
  const postQuantumCiphers = CipherRegistry.getByCategory('post-quantum');
  
  const filteredCiphers = searchQuery
    ? CipherRegistry.search(searchQuery)
    : allCiphers;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'symmetric':
        return <Shield className="w-5 h-5 text-emerald-600" />;
      case 'asymmetric':
        return <Lock className="w-5 h-5 text-amber-600" />;
      case 'post-quantum':
        return <Zap className="w-5 h-5 text-purple-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
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

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Cryptography
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Sandbox
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Interactive playground for exploring 20 encryption algorithms. 
            Learn, experiment, and understand modern cryptography with hands-on tools.
          </p>
          
          {/* Search */}
          <div className="max-w-lg mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search ciphers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-700">{symmetricCiphers.length}</div>
              <div className="text-sm text-emerald-600">Symmetric Ciphers</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">{asymmetricCiphers.length}</div>
              <div className="text-sm text-amber-600">Asymmetric Ciphers</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{postQuantumCiphers.length}</div>
              <div className="text-sm text-purple-600">Post-Quantum Ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Ciphers */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Ciphers</h2>
          <Link 
            href="/ciphers"
            className="btn btn-primary"
          >
            View All Ciphers
            <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCiphers.slice(0, 6).map((cipher) => (
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
                {cipher.id === 'aes' && (
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {cipher.description}
              </p>
              
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
            </Link>
          ))}
        </div>

        {filteredCiphers.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              No ciphers found matching "{searchQuery}"
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>

      {/* Categories Overview */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Cipher Categories</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Symmetric */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
              <h3 className="text-xl font-semibold text-emerald-900">
                Symmetric Encryption
              </h3>
            </div>
            <p className="text-emerald-700 mb-4">
              Fast encryption using the same key for both encryption and decryption. 
              Perfect for securing large amounts of data.
            </p>
            <div className="space-y-2">
              {symmetricCiphers.slice(0, 3).map(cipher => (
                <Link
                  key={cipher.id}
                  href={`/cipher/${cipher.id}`}
                  className="block text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                >
                  • {cipher.name}
                </Link>
              ))}
              {symmetricCiphers.length > 3 && (
                <div className="text-emerald-600 text-sm">
                  +{symmetricCiphers.length - 3} more...
                </div>
              )}
            </div>
          </div>

          {/* Asymmetric */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
              <h3 className="text-xl font-semibold text-amber-900">
                Asymmetric Encryption
              </h3>
            </div>
            <p className="text-amber-700 mb-4">
              Public-key cryptography using separate keys for encryption and decryption. 
              Essential for secure communication.
            </p>
            <div className="space-y-2">
              {asymmetricCiphers.slice(0, 3).map(cipher => (
                <Link
                  key={cipher.id}
                  href={`/cipher/${cipher.id}`}
                  className="block text-amber-600 hover:text-amber-800 text-sm font-medium"
                >
                  • {cipher.name}
                </Link>
              ))}
              {asymmetricCiphers.length > 3 && (
                <div className="text-amber-600 text-sm">
                  +{asymmetricCiphers.length - 3} more...
                </div>
              )}
            </div>
          </div>

          {/* Post-Quantum */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-semibold text-purple-900">
                Post-Quantum Cryptography
              </h3>
            </div>
            <p className="text-purple-700 mb-4">
              Next-generation algorithms designed to resist quantum computer attacks. 
              The future of cryptographic security.
            </p>
            <div className="space-y-2">
              {postQuantumCiphers.slice(0, 3).map(cipher => (
                <Link
                  key={cipher.id}
                  href={`/cipher/${cipher.id}`}
                  className="block text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  • {cipher.name}
                </Link>
              ))}
              {postQuantumCiphers.length > 3 && (
                <div className="text-purple-600 text-sm">
                  +{postQuantumCiphers.length - 3} more...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Why Use Cipher Sandbox?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure Implementation</h3>
            <p className="text-gray-600 text-sm">
              Well-tested cryptographic libraries with proper security practices
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Interactive Learning</h3>
            <p className="text-gray-600 text-sm">
              Hands-on experience with real encryption and decryption
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Modern Algorithms</h3>
            <p className="text-gray-600 text-sm">
              From classic AES to cutting-edge post-quantum cryptography
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Educational Focus</h3>
            <p className="text-gray-600 text-sm">
              Clear explanations, security notes, and best practices
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
