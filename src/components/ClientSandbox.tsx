'use client';

import { CipherMetadata } from '@/types/crypto';
import Sandbox from './Sandbox';

interface ClientSandboxProps {
  cipherMetadata: CipherMetadata;
}

export default function ClientSandbox({ cipherMetadata }: ClientSandboxProps) {
  return <Sandbox cipherMetadata={cipherMetadata} />;
}
