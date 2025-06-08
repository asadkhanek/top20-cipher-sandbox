export type CipherCategory = 'symmetric' | 'asymmetric' | 'post-quantum';

export type CipherMode = 'ECB' | 'CBC' | 'CFB' | 'OFB' | 'CTR' | 'GCM' | 'CCM' | 'Stream' | 'PKCS1' | 'OAEP';

export interface CipherVariant {
  id: string;
  name: string;
  keySize: number;
}

export interface CipherReference {
  title: string;
  url: string;
}

export interface SecurityNote {
  level: 'info' | 'warning' | 'danger';
  message: string;
}

export interface CipherMetadata {
  id: string;
  name: string;
  category: CipherCategory;
  variants: CipherVariant[];
  modes?: CipherMode[];
  description: string;
  keyRequirements: {
    minKeySize: number;
    maxKeySize: number;
    keySizes: number[];
  };
  ivRequired: boolean;
  ivSize?: number;
  nonceRequired: boolean;
  nonceSize?: number;
  securityNotes: SecurityNote[];
  references: CipherReference[];
  complexity: 'low' | 'medium' | 'high';
  performance: 'fast' | 'medium' | 'slow';
}

export interface EncryptionParams {
  plaintext: string;
  key: string;
  iv?: string;
  nonce?: string;
  mode?: CipherMode;
  variant?: string;
  additionalData?: string;
  salt?: string;
  iterations?: number;
}

export interface DecryptionParams {
  ciphertext: string;
  key: string;
  iv?: string;
  nonce?: string;
  mode?: CipherMode;
  variant?: string;
  additionalData?: string;
  salt?: string;
  iterations?: number;
}

export interface CryptoOperation {
  success: boolean;
  result?: string;
  error?: string;  metadata?: {
    keyLength: number;
    ivLength?: number;
    nonceLength?: number;
    mode?: string;
    variant?: string;
    iv?: string;
    nonce?: string;
  };
}

export interface CipherEngine {
  metadata: CipherMetadata;
  encrypt(params: EncryptionParams): Promise<CryptoOperation>;
  decrypt(params: DecryptionParams): Promise<CryptoOperation>; 
  generateKey(keySize?: number): Promise<string>;
  generateIV?(ivSize?: number): Promise<string>;
  generateNonce?(nonceSize?: number): Promise<string>;
  validateKey(key: string, keySize?: number): boolean;
  validateIV?(iv: string): boolean;
  validateNonce?(nonce: string): boolean;
}

export interface SandboxState {
  mode: 'encrypt' | 'decrypt';
  plaintext: string;
  ciphertext: string;
  key: string;
  iv: string;
  nonce: string;
  selectedMode: CipherMode;
  selectedVariant: string;
  additionalData: string;
  salt: string;
  iterations: number;
  inputFormat: 'text' | 'hex' | 'base64';
  outputFormat: 'text' | 'hex' | 'base64';
  isProcessing: boolean;
  result?: CryptoOperation;
}
