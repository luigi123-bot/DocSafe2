// Import global CSS styles
import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import HeaderControls from '~/components/HeaderControls';
import ClientOnly from '~/components/ClientOnly';

export const metadata: Metadata = {
  title: 'DocSafe - Gestión Inteligente de Documentos',
  description: 'Sistema avanzado de gestión documental con OCR y organización inteligente',
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="es" className={geist.variable} suppressHydrationWarning>
        <body className="min-h-screen bg-gray-50 font-sans antialiased" suppressHydrationWarning>
          {/* Header simple con solo autenticación */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gray-900">DocSafe</h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <ClientOnly fallback={
                    <div className="bg-gray-200 animate-pulse h-9 w-24 rounded-md"></div>
                  }>
                    <SignedOut>
                      <SignInButton>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                          Iniciar Sesión
                        </button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      <HeaderControls />
                    </SignedIn>
                  </ClientOnly>
                </div>
              </div>
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}