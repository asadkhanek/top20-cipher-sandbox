'use client';

import React, { useState, useEffect } from 'react';
import { CipherMetadata, SandboxState, CryptoOperation, CipherMode } from '@/types/crypto';
import CipherRegistry from '@/crypto/registry';
import { Copy, Key, Shuffle, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SandboxProps {
  cipherMetadata: CipherMetadata;
}

export default function Sandbox({ cipherMetadata }: SandboxProps) {
  const [state, setState] = useState<SandboxState>({
    mode: 'encrypt',
    plaintext: '',
    ciphertext: '',
    key: '',
    iv: '',
    nonce: '',
    selectedMode: cipherMetadata.modes?.[0] || 'CBC',
    selectedVariant: cipherMetadata.variants[0]?.id || '',
    additionalData: '',
    salt: '',
    iterations: 10000,
    inputFormat: 'text',
    outputFormat: 'hex',
    isProcessing: false
  });

  const [result, setResult] = useState<CryptoOperation | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<{ [key: string]: boolean }>({});

  // Get cipher engine
  const engine = CipherRegistry.getEngine(cipherMetadata.id);

  // Handle input changes
  const updateState = (updates: Partial<SandboxState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Generate secure random key
  const generateKey = async () => {
    if (!engine) return;
    
    try {
      const variant = cipherMetadata.variants.find(v => v.id === state.selectedVariant);
      const keySize = variant?.keySize || cipherMetadata.keyRequirements.maxKeySize;
      const newKey = await engine.generateKey(keySize);
      updateState({ key: newKey });
    } catch (error) {
      console.error('Key generation failed:', error);
    }
  };

  // Generate IV
  const generateIV = async () => {
    if (!engine || !engine.generateIV) return;
    
    try {
      const newIV = await engine.generateIV();
      updateState({ iv: newIV });
    } catch (error) {
      console.error('IV generation failed:', error);
    }
  };

  // Generate nonce
  const generateNonce = async () => {
    if (!engine || !engine.generateNonce) return;
    
    try {
      const newNonce = await engine.generateNonce();
      updateState({ nonce: newNonce });
    } catch (error) {
      console.error('Nonce generation failed:', error);
    }
  };
  // Perform encryption
  const encrypt = async () => {
    if (!engine) return;
    
    const validation = validateInputs();
    if (!validation.isValid) {
      setResult({
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      });
      return;
    }
    
    updateState({ isProcessing: true });
    setResult(null);
    
    try {
      const result = await engine.encrypt({
        plaintext: state.plaintext,
        key: state.key,
        iv: state.iv || undefined,
        nonce: state.nonce || undefined,
        mode: state.selectedMode,
        variant: state.selectedVariant,
        additionalData: state.additionalData || undefined
      });
      
      setResult(result);
      if (result.success && result.result) {
        updateState({ ciphertext: result.result });
      }
    } catch (error) {
      setResult({
        success: false,
        error: `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      updateState({ isProcessing: false });
    }
  };
  // Perform decryption
  const decrypt = async () => {
    if (!engine) return;
    
    const validation = validateInputs();
    if (!validation.isValid) {
      setResult({
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      });
      return;
    }
    
    updateState({ isProcessing: true });
    setResult(null);
    
    try {
      const result = await engine.decrypt({
        ciphertext: state.ciphertext,
        key: state.key,
        iv: state.iv || undefined,
        nonce: state.nonce || undefined,
        mode: state.selectedMode,
        variant: state.selectedVariant,
        additionalData: state.additionalData || undefined
      });
      
      setResult(result);
      if (result.success && result.result) {
        updateState({ plaintext: result.result });
      }
    } catch (error) {
      setResult({
        success: false,
        error: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      updateState({ isProcessing: false });
    }
  };
  // Input validation
  const validateInputs = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (state.mode === 'encrypt') {
      if (!state.plaintext.trim()) {
        errors.push('Plaintext is required for encryption');
      }
    } else {
      if (!state.ciphertext.trim()) {
        errors.push('Ciphertext is required for decryption');
      }
      // Validate hex format for ciphertext
      if (state.ciphertext && !/^[0-9a-fA-F]*$/.test(state.ciphertext.replace(/\s/g, ''))) {
        errors.push('Ciphertext must be in hexadecimal format');
      }
    }
    
    if (!state.key.trim()) {
      errors.push('Key is required');
    } else {
      // Validate hex format for key
      if (!/^[0-9a-fA-F]*$/.test(state.key.replace(/\s/g, ''))) {
        errors.push('Key must be in hexadecimal format');
      } else {
        // Validate key length
        const variant = cipherMetadata.variants.find(v => v.id === state.selectedVariant);
        const expectedKeyBytes = variant?.keySize || cipherMetadata.keyRequirements.maxKeySize;
        const keyBytes = state.key.replace(/\s/g, '').length / 2;
        if (keyBytes !== expectedKeyBytes) {
          errors.push(`Key must be ${expectedKeyBytes} bytes (${expectedKeyBytes * 2} hex characters), got ${keyBytes} bytes`);
        }
      }
    }
    
    if (cipherMetadata.ivRequired && state.selectedMode !== 'ECB' && !state.iv.trim()) {
      errors.push('IV is required for this cipher mode');
    } else if (state.iv && !/^[0-9a-fA-F]*$/.test(state.iv.replace(/\s/g, ''))) {
      errors.push('IV must be in hexadecimal format');
    }
    
    if (cipherMetadata.nonceRequired && !state.nonce.trim()) {
      errors.push('Nonce is required for this cipher');
    } else if (state.nonce && !/^[0-9a-fA-F]*$/.test(state.nonce.replace(/\s/g, ''))) {
      errors.push('Nonce must be in hexadecimal format');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Copy to clipboard with feedback
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(prev => ({ ...prev, [fieldName]: true }));
      setTimeout(() => {
        setCopyFeedback(prev => ({ ...prev, [fieldName]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers or when clipboard API is not available
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyFeedback(prev => ({ ...prev, [fieldName]: true }));
        setTimeout(() => {
          setCopyFeedback(prev => ({ ...prev, [fieldName]: false }));
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy method also failed:', fallbackError);
      }
    }
  };

  // Clear all fields
  const clearAll = () => {
    setState(prev => ({
      ...prev,
      plaintext: '',
      ciphertext: '',
      key: '',
      iv: '',
      nonce: '',
      additionalData: ''
    }));
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Crypto Sandbox</h3>
          <div className="flex gap-2">
            <button
              onClick={clearAll}
              className="btn btn-secondary text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operation Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateState({ mode: 'encrypt' })}
                className={`btn ${state.mode === 'encrypt' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Encrypt
              </button>
              <button
                onClick={() => updateState({ mode: 'decrypt' })}
                className={`btn ${state.mode === 'decrypt' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Decrypt
              </button>
            </div>
          </div>

          {/* Variant Selection */}
          {cipherMetadata.variants.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variant
              </label>
              <select
                value={state.selectedVariant}
                onChange={(e) => updateState({ selectedVariant: e.target.value })}
                className="select"
              >
                {cipherMetadata.variants.map(variant => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} ({variant.keySize * 8}-bit)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Mode Selection for Block Ciphers */}
        {cipherMetadata.modes && cipherMetadata.modes.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cipher Mode
            </label>
            <select
              value={state.selectedMode}
              onChange={(e) => updateState({ selectedMode: e.target.value as CipherMode })}
              className="select max-w-xs"
            >
              {cipherMetadata.modes.map(mode => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Key Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key (Hex)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={state.key}
              onChange={(e) => updateState({ key: e.target.value })}
              placeholder={`Enter ${(cipherMetadata.variants.find(v => v.id === state.selectedVariant)?.keySize || 32) * 2} hex characters...`}
              className="input flex-1 font-mono"
            />
            <button
              onClick={generateKey}
              className="btn btn-secondary"
              title="Generate Random Key"
            >
              <Key className="w-4 h-4" />
            </button>            <button
              onClick={() => copyToClipboard(state.key, 'key')}
              className="btn btn-secondary"
              title="Copy Key"
              disabled={!state.key}
            >
              {copyFeedback.key ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* IV Input */}
        {cipherMetadata.ivRequired && state.selectedMode !== 'ECB' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IV (Hex)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={state.iv}
                onChange={(e) => updateState({ iv: e.target.value })}
                placeholder={`Enter ${cipherMetadata.ivSize ? cipherMetadata.ivSize * 2 : 32} hex characters...`}
                className="input flex-1 font-mono"
              />
              <button
                onClick={generateIV}
                className="btn btn-secondary"
                title="Generate Random IV"
              >
                <Shuffle className="w-4 h-4" />
              </button>              <button
                onClick={() => copyToClipboard(state.iv, 'iv')}
                className="btn btn-secondary"
                title="Copy IV"
                disabled={!state.iv}
              >
                {copyFeedback.iv ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Nonce Input */}
        {cipherMetadata.nonceRequired && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nonce (Hex)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={state.nonce}
                onChange={(e) => updateState({ nonce: e.target.value })}
                placeholder={`Enter ${cipherMetadata.nonceSize ? cipherMetadata.nonceSize * 2 : 24} hex characters...`}
                className="input flex-1 font-mono"
              />
              <button
                onClick={generateNonce}
                className="btn btn-secondary"
                title="Generate Random Nonce"
              >
                <Shuffle className="w-4 h-4" />
              </button>              <button
                onClick={() => copyToClipboard(state.nonce, 'nonce')}
                className="btn btn-secondary"
                title="Copy Nonce"
                disabled={!state.nonce}
              >
                {copyFeedback.nonce ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plaintext */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Plaintext</h4>            <button
              onClick={() => copyToClipboard(state.plaintext, 'plaintext')}
              className="btn btn-secondary btn-sm"
              disabled={!state.plaintext}
            >
              {copyFeedback.plaintext ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            value={state.plaintext}
            onChange={(e) => updateState({ plaintext: e.target.value })}
            placeholder="Enter your message here..."
            className="textarea w-full h-32"
          />
          <div className="mt-4">
            <button
              onClick={encrypt}
              disabled={!state.plaintext || !state.key || state.isProcessing}
              className="btn btn-primary w-full"
            >
              {state.isProcessing ? 'Encrypting...' : 'Encrypt'}
            </button>
          </div>
        </div>

        {/* Ciphertext */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Ciphertext (Hex)</h4>            <button
              onClick={() => copyToClipboard(state.ciphertext, 'ciphertext')}
              className="btn btn-secondary btn-sm"
              disabled={!state.ciphertext}
            >
              {copyFeedback.ciphertext ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            value={state.ciphertext}
            onChange={(e) => updateState({ ciphertext: e.target.value })}
            placeholder="Ciphertext will appear here..."
            className="textarea w-full h-32 font-mono"
          />
          <div className="mt-4">
            <button
              onClick={decrypt}
              disabled={!state.ciphertext || !state.key || state.isProcessing}
              className="btn btn-primary w-full"
            >
              {state.isProcessing ? 'Decrypting...' : 'Decrypt'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 mt-0.5 text-red-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">
                {result.success ? 'Operation Successful' : 'Operation Failed'}
              </div>
              {result.error && (
                <div className="text-sm mt-1">
                  {result.error}
                </div>
              )}
              {result.metadata && (
                <div className="text-sm mt-2 space-y-1">
                  <div>Key Length: {result.metadata.keyLength} bytes</div>
                  {result.metadata.ivLength && (
                    <div>IV Length: {result.metadata.ivLength} bytes</div>
                  )}
                  {result.metadata.nonceLength && (
                    <div>Nonce Length: {result.metadata.nonceLength} bytes</div>
                  )}
                  {result.metadata.mode && (
                    <div>Mode: {result.metadata.mode}</div>
                  )}
                  {result.metadata.variant && (
                    <div>Variant: {result.metadata.variant}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Notes */}
      {cipherMetadata.securityNotes.length > 0 && (
        <div className="card">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Security Notes
          </h4>
          <div className="space-y-2">
            {cipherMetadata.securityNotes.map((note, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border-l-4 ${
                  note.level === 'danger'
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : note.level === 'warning'
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                    : 'bg-blue-50 border-blue-400 text-blue-700'
                }`}
              >
                <div className="text-sm font-medium capitalize">{note.level}</div>
                <div className="text-sm">{note.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
