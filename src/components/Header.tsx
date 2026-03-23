'use client';

import { Home, Plus, Bell, User, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Header() {
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

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Properties
            </Link>
            <Link
              href="/enhance"
              className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Enhance
            </Link>
            <Link
              href="#"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              3D Models
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Property</span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Agent</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
