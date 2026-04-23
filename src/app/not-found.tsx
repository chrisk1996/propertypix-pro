import { Header } from '@/components/Header';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-32 pb-16 text-center">
        <span className="material-symbols-outlined text-[#c4c6cd] text-8xl mb-6 block">explore_off</span>
        <h1 className="font-serif text-5xl text-[#1d2832] mb-3">404</h1>
        <h2 className="font-serif text-2xl text-[#1d2832] mb-3">Page not found</h2>
        <p className="text-[#43474c] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-[#006c4d] text-white rounded-lg font-medium hover:opacity-90 transition-all"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-[#edf4ff] text-[#1d2832] rounded-lg font-medium hover:bg-[#e3efff] transition-all"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
