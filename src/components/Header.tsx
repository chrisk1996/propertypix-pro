'use client';

import { Home, Menu, X, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data }: { data: { user: { email: string } | null } }) => {
      if (data.user) setUser({ email: data.user.email || '' });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: { email: string } } | null) => {
      setUser(session?.user ? { email: session.user.email || '' } : null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#f7f9ff]/80 backdrop-blur-md border-b border-[#c4c6cd]/10">
      <div className="max-w-[1920px] mx-auto flex justify-between items-center px-12 py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="Zestio" className="h-10 w-auto" />
        </Link>

        {/* Nav - Desktop */}
        <nav className="hidden md:flex items-center gap-10 font-serif font-light tracking-tight">
          <Link href="/#products" className="text-[#006c4d] border-b-2 border-[#006c4d] pb-1">
            Products
          </Link>
          <span className="text-[#1d2832] opacity-40 cursor-not-allowed"> Solutions </span>
          <Link href="/pricing" className="text-[#1d2832] opacity-80 hover:text-[#006c4d] transition-colors">
            Pricing
          </Link>
          <span className="text-[#1d2832] opacity-40 cursor-not-allowed"> About </span>
        </nav>

        {/* Auth - Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 text-[#1d2832] opacity-80 hover:opacity-100 transition-opacity font-manrope text-sm uppercase tracking-widest">
                <User className="w-4 h-4" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-[#1d2832] opacity-60 hover:opacity-100 transition-opacity font-manrope text-sm uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="text-sm font-manrope uppercase tracking-widest text-[#1d2832] opacity-80 hover:opacity-100 transition-opacity">
                Login
              </Link>
              <Link href="/auth" className="bg-[#1d2832] text-white px-8 py-2.5 text-xs font-manrope uppercase tracking-widest rounded hover:bg-[#333e48] transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-[#1d2832]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#f7f9ff] border-b border-[#c4c6cd]/10">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/#products"
              className="block px-4 py-2 text-[#006c4d] font-manrope text-xs uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <span className="block px-4 py-2 text-[#1d2832] opacity-40 cursor-not-allowed font-manrope text-xs uppercase tracking-widest"> Solutions </span>
            <Link
              href="/pricing"
              className="block px-4 py-2 text-[#1d2832] opacity-80 font-manrope text-xs uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <span className="block px-4 py-2 text-[#1d2832] opacity-40 cursor-not-allowed font-manrope text-xs uppercase tracking-widest"> About </span>
            <hr className="my-2 border-[#c4c6cd]/20" />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-[#1d2832] opacity-80 font-manrope text-xs uppercase tracking-widest"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {user.email}
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-red-600 font-manrope text-xs uppercase tracking-widest"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="block px-4 py-2 text-[#1d2832] opacity-80 font-manrope text-xs uppercase tracking-widest"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth"
                  className="block px-4 py-2 bg-[#1d2832] text-white text-center font-manrope text-xs uppercase tracking-widest rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
