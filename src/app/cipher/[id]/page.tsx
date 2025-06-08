import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Shield, Clock, Zap, AlertTriangle } from 'lucide-react';
import CipherRegistry from '@/crypto/registry';
import ClientSandbox from '@/components/ClientSandbox';

interface CipherPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CipherPage({ params }: CipherPageProps) {
  const { id } = await params;
  const cipherMetadata = CipherRegistry.getMetadata(id);
  
  if (!cipherMetadata) {
    notFound();
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'symmetric':
        return <Shield className="w-6 h-6 text-emerald-600" />;
      case 'asymmetric':
        return <Shield className="w-6 h-6 text-amber-600" />;
      case 'post-quantum':
        return <Zap className="w-6 h-6 text-purple-600" />;
      default:
        return <Shield className="w-6 h-6 text-gray-600" />;
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

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'fast':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'slow':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span>/</span>
        <Link href="/ciphers" className="hover:text-gray-900">
          Ciphers
        </Link>
        <span>/</span>
        <span className="text-gray-900">{cipherMetadata.name}</span>
      </nav>

      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Ciphers
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            {getCategoryIcon(cipherMetadata.category)}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {cipherMetadata.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryBadgeClass(cipherMetadata.category)}`}>
                  {cipherMetadata.category}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className={getPerformanceColor(cipherMetadata.performance)}>
                    {cipherMetadata.performance} performance
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className={getComplexityColor(cipherMetadata.complexity)}>
                    {cipherMetadata.complexity} complexity
                  </span>
                </div>
              </div>
              <p className="text-gray-700 max-w-3xl">
                {cipherMetadata.description}
              </p>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
          {/* Key Sizes */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Key Sizes</h3>
            <div className="space-y-1">
              {cipherMetadata.variants.map(variant => (
                <div key={variant.id} className="text-sm text-gray-600">
                  {variant.keySize * 8} bits
                </div>
              ))}
            </div>
          </div>

          {/* Modes */}
          {cipherMetadata.modes && cipherMetadata.modes.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Supported Modes</h3>
              <div className="space-y-1">
                {cipherMetadata.modes.map(mode => (
                  <div key={mode} className="text-sm text-gray-600">
                    {mode}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Requirements</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {cipherMetadata.ivRequired && (
                <div>IV: {cipherMetadata.ivSize} bytes</div>
              )}
              {cipherMetadata.nonceRequired && (
                <div>Nonce: {cipherMetadata.nonceSize} bytes</div>
              )}
              {!cipherMetadata.ivRequired && !cipherMetadata.nonceRequired && (
                <div>Key only</div>
              )}
            </div>
          </div>

          {/* Variants */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Variants</h3>
            <div className="space-y-1">
              {cipherMetadata.variants.map(variant => (
                <div key={variant.id} className="text-sm text-gray-600">
                  {variant.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security Notes */}
      {cipherMetadata.securityNotes.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Security Considerations
          </h2>
          <div className="space-y-4">
            {cipherMetadata.securityNotes.map((note, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  note.level === 'danger'
                    ? 'bg-red-50 border-red-400'
                    : note.level === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className={`font-medium mb-1 capitalize ${
                  note.level === 'danger'
                    ? 'text-red-800'
                    : note.level === 'warning'
                    ? 'text-yellow-800'
                    : 'text-blue-800'
                }`}>
                  {note.level}
                </div>
                <div className={`text-sm ${
                  note.level === 'danger'
                    ? 'text-red-700'
                    : note.level === 'warning'
                    ? 'text-yellow-700'
                    : 'text-blue-700'
                }`}>
                  {note.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {cipherMetadata.references.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            References & Documentation
          </h2>
          <div className="space-y-3">
            {cipherMetadata.references.map((ref, index) => (
              <a
                key={index}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                {ref.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Sandbox */}
      <ClientSandbox cipherMetadata={cipherMetadata} />
    </div>
  );
}

export async function generateStaticParams() {
  // Get all cipher IDs for static generation
  const cipherIds = CipherRegistry.getAllIds();
  
  return cipherIds.map((id) => ({
    id: id,
  }));
}
