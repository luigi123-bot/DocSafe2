"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";
import { Button } from "~/components/ui/button";
import DocuSafeLogo from "./DocuSafeLogo";

interface NavbarProps {
  showUserMenu?: boolean;
}

export default function Navbar({ showUserMenu: _showUserMenu = false }: NavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-red-500 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <DocuSafeLogo className="text-white" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white hover:bg-red-600 focus:bg-red-600 data-[active]:bg-red-600 data-[state=open]:bg-red-600">
                    Documentos
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-white border border-gray-200 shadow-lg">
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/documents/upload"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 text-gray-900"
                        >
                          <div className="text-sm font-medium leading-none text-gray-900">Subir Documentos</div>
                          <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                            Digitaliza y sube nuevos documentos al sistema
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/documents/search"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 text-gray-900"
                        >
                          <div className="text-sm font-medium leading-none text-gray-900">Buscar Documentos</div>
                          <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                            Encuentra documentos usando OCR y metadatos
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/analytics" legacyBehavior passHref>
                    <NavigationMenuLink 
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-red-600 focus:bg-red-600 ${
                        isActive('/analytics') ? 'bg-red-600' : ''
                      }`}
                    >
                      Analíticas
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/dashboard" legacyBehavior passHref>
                    <NavigationMenuLink 
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-red-600 focus:bg-red-600 ${
                        isActive('/dashboard') || isActive('/') ? 'bg-red-600' : ''
                      }`}
                    >
                      Dashboard
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton>
                <Button variant="ghost" className="text-white hover:bg-red-600">
                  Iniciar Sesión
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </SignedIn>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:bg-red-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-red-400">
              <Link 
                href="/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-red-600 ${
                  isActive('/dashboard') || isActive('/') ? 'bg-red-600' : ''
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/documents/upload"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600"
              >
                Subir Documentos
              </Link>
              <Link 
                href="/documents/search"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600"
              >
                Buscar Documentos
              </Link>
              <Link 
                href="/analytics"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-red-600 ${
                  isActive('/analytics') ? 'bg-red-600' : ''
                }`}
              >
                Analíticas
              </Link>
              
              <SignedOut>
                <div className="border-t border-red-400 pt-4">
                  <SignInButton>
                    <button className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-red-600">
                      Iniciar Sesión
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}