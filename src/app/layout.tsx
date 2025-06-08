import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Top 20 Cipher Sandbox',
  description: 'Interactive cryptography sandbox with 20 encryption algorithms including AES, ChaCha20, RSA, and post-quantum ciphers',
  keywords: 'cryptography, encryption, decryption, AES, ChaCha20, RSA, ciphers, security',
  authors: [{ name: 'Cipher Sandbox' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <a href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">C</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        Cipher Sandbox
                      </h1>
                      <p className="text-xs text-gray-500">
                        Top 20 Cryptographic Algorithms
                      </p>
                    </div>
                  </a>
                </div>
                
                <div className="flex items-center space-x-4">
                  <a
                    href="/"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Home
                  </a>
                  <a
                    href="/ciphers"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    All Ciphers
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-gray-600 text-sm">
                <p>
                  © 2025 Cipher Sandbox. Built for educational and research purposes.
                </p>
                <p className="mt-2">
                  This tool is for learning and testing cryptographic algorithms. 
                  Do not use for production systems without proper security review.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
