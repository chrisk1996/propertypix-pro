'use client';

import { Home, Sparkles, Box, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PropertyPix Pro</span>
          </Link>

          {/* Nav - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/enhance"
              className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Enhance
            </Link>
            <Link
              href="/floorplan"
              className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <Box className="w-4 h-4" />
              Floor Plan 3D
            </Link>
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* Auth - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/enhance"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="w-4 h-4" />
              Enhance
            </Link>
            <Link
              href="/floorplan"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Box className="w-4 h-4" />
              Floor Plan 3D
            </Link>
            <Link
              href="/pricing"
              className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <hr className="my-2" />
            <Link
              href="/auth"
              className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="block px-4 py-2 bg-indigo-600 text-white text-center rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
