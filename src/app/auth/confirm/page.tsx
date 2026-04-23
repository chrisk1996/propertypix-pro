'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient();

      // PKCE flow — exchange code for session
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // Code might be expired or already used — check if user is already logged in
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Already authenticated — the code was used before, just redirect
            setStatus('success');
            setMessage('Your email is confirmed!');
            setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 2000);
            return;
          }
          setStatus('error');
          setMessage(error.message);
          return;
        }

        setStatus('success');
        setMessage('Your email has been confirmed!');
        setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 2000);
        return;
      }

      // No code param — check if already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('success');
        setMessage('You\'re already signed in.');
        setTimeout(() => { router.push('/dashboard'); }, 1000);
      } else {
        setStatus('error');
        setMessage('No verification code found. Please try the link from your email again.');
      }
    };

    confirmEmail();
  }, [router, searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#006c4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#43474c]">Confirming your email...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[#c4c6cd]/20 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error</span>
          <h1 className="font-serif text-2xl text-[#1d2832] mb-2">Confirmation Issue</h1>
          <p className="text-sm text-[#43474c] mb-6">{message}</p>
          <p className="text-xs text-[#43474c] mb-4">
            The link may have expired or been used already. You can still log in if your email was confirmed.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/auth"
              className="px-6 py-2 bg-[#006c4d] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
            >
              Go to Login
            </a>
            <a
              href="/auth"
              className="px-6 py-2 bg-[#edf4ff] text-[#1d2832] rounded-lg text-sm font-medium hover:bg-[#e3efff] transition-all"
            >
              Resend Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#c4c6cd]/20 max-w-md w-full text-center">
        <span className="material-symbols-outlined text-[#006c4d] text-4xl mb-4">check_circle</span>
        <h1 className="font-serif text-2xl text-[#1d2832] mb-2">Email Confirmed!</h1>
        <p className="text-sm text-[#43474c] mb-4">{message}</p>
        <p className="text-xs text-[#43474c]">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
