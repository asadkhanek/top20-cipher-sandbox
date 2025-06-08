'use client';

import { useState, useEffect } from 'react';
import CipherRegistry from '@/crypto/registry';
import { CipherEngine, EncryptionParams, DecryptionParams, CryptoOperation } from '@/types/crypto';

interface TestResult {
  id: string;
  name: string;
  success: boolean;
  error?: string;
  details?: string;
}

export default function CipherTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const testInput = 'Hello, World! This is a test message for cipher encryption.';

  const testCipher = async (engine: CipherEngine): Promise<TestResult> => {
    const metadata = engine.metadata;
    const result: TestResult = {
      id: metadata.id,
      name: metadata.name,
      success: false
    };

    try {
      console.log(`🔐 Testing cipher: ${metadata.name} (${metadata.id})`);
      
      // Get key size from keyRequirements
      const keySize = metadata.keyRequirements.keySizes[0] || 32;
      
      // Generate key
      let key: string;
      try {
        key = await engine.generateKey(keySize);
      } catch (error: any) {
        console.log(`⚠️  generateKey failed, using fallback: ${error.message}`);
        // Fallback key generation (hex string)
        key = Array(keySize).fill(0).map(() => 
          Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join('');
      }
      
      // Generate IV if required
      let iv: string | undefined;
      if (metadata.ivRequired && engine.generateIV) {
        try {
          iv = await engine.generateIV(metadata.ivSize);
        } catch (error: any) {
          console.log(`⚠️  generateIV failed, using fallback: ${error.message}`);
          const ivSize = metadata.ivSize || 16;
          iv = Array(ivSize).fill(0).map(() => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
          ).join('');
        }
      }
      
      // Generate nonce if required
      let nonce: string | undefined;
      if (metadata.nonceRequired && engine.generateNonce) {
        try {
          nonce = await engine.generateNonce(metadata.nonceSize);
        } catch (error: any) {
          console.log(`⚠️  generateNonce failed, using fallback: ${error.message}`);
          const nonceSize = metadata.nonceSize || 12;
          nonce = Array(nonceSize).fill(0).map(() => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
          ).join('');
        }
      }
      
      // Prepare encryption parameters
      const encryptParams: EncryptionParams = {
        plaintext: testInput,
        key: key,
        iv: iv,
        nonce: nonce,
        mode: metadata.modes?.[0],
        variant: metadata.variants[0]?.id
      };
      
      // Test encryption
      const encrypted: CryptoOperation = await engine.encrypt(encryptParams);
      
      if (!encrypted.success || !encrypted.result) {
        result.error = `Encryption failed: ${encrypted.error || 'Unknown error'}`;
        return result;
      }
      
      if (encrypted.result === testInput) {
        result.error = 'Encryption returned plaintext unchanged';
        return result;
      }
      
      // Test decryption (skip for hash functions or asymmetric ciphers)
      if (metadata.category !== 'symmetric') {
        result.success = true;
        result.details = 'Encryption test passed (decryption skipped for non-symmetric cipher)';
        return result;
      }
      
      // Prepare decryption parameters
      const decryptParams: DecryptionParams = {
        ciphertext: encrypted.result,
        key: key,
        iv: iv,
        nonce: nonce,
        mode: metadata.modes?.[0],
        variant: metadata.variants[0]?.id
      };
      
      const decrypted: CryptoOperation = await engine.decrypt(decryptParams);
      
      if (!decrypted.success || !decrypted.result) {
        result.error = `Decryption failed: ${decrypted.error || 'Unknown error'}`;
        return result;
      }
      
      if (decrypted.result !== testInput) {
        result.error = `Decryption mismatch. Expected: "${testInput}", Got: "${decrypted.result}"`;
        return result;
      }
      
      result.success = true;
      result.details = 'Encryption and decryption both passed';
      
    } catch (error: any) {
      result.error = `Test failed with exception: ${error.message}`;
    }
    
    return result;
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const cipherList = CipherRegistry.getAllMetadata();
    const testResults: TestResult[] = [];

    for (let i = 0; i < cipherList.length; i++) {
      const cipherInfo = cipherList[i];
      
      try {
        const engine = CipherRegistry.getEngine(cipherInfo.id);
        
        if (!engine) {
          testResults.push({
            id: cipherInfo.id,
            name: cipherInfo.name,
            success: false,
            error: 'Engine not found in registry'
          });
        } else {
          const result = await testCipher(engine);
          testResults.push(result);
        }
        
      } catch (error: any) {
        testResults.push({
          id: cipherInfo.id,
          name: cipherInfo.name,
          success: false,
          error: `Failed to load engine: ${error.message}`
        });
      }
      
      setProgress((i + 1) / cipherList.length * 100);
      setResults([...testResults]);
    }

    setIsRunning(false);
  };

  const passedCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const successRate = results.length > 0 ? ((passedCount / results.length) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 Cipher Engine Tests</h1>
        
        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run All Cipher Tests'}
          </button>
        </div>
        
        {isRunning && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{progress.toFixed(1)}% complete</p>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Tests</h3>
              <p className="text-2xl font-bold text-blue-600">{results.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Passed</h3>
              <p className="text-2xl font-bold text-green-600">{passedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Failed</h3>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Test Results ({successRate}% success rate)
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div 
                    key={result.id}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{result.name}</h3>
                        <p className="text-sm text-gray-600">{result.id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          result.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.success ? '✅ PASSED' : '❌ FAILED'}
                        </span>
                      </div>
                    </div>
                    {result.error && (
                      <p className="mt-2 text-sm text-red-600">Error: {result.error}</p>
                    )}
                    {result.details && (
                      <p className="mt-2 text-sm text-gray-600">{result.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
