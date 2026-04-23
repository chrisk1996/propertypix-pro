'use client';

import { Header } from '@/components/Header';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-32 pb-16 text-center">
        <span className="material-symbols-outlined text-[#006c4d] text-6xl mb-6 block">error_outline</span>
        <h1 className="font-serif text-3xl text-[#1d2832] mb-3">Something went wrong</h1>
        <p className="text-[#43474c] mb-8">
          An unexpected error occurred. Try again or contact support if the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#006c4d] text-white rounded-lg font-medium hover:opacity-90 transition-all"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-[#edf4ff] text-[#1d2832] rounded-lg font-medium hover:bg-[#e3efff] transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
