'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useTranslations } from 'next-intl';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError(t('fillAllFields'));
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError(t('passwordsNoMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/dashboard');
        router.refresh();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        setSuccess(t('checkEmail'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('authFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('googleAuthFailed'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Header />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-[#1d2832] mb-2">
            {isLogin ? t('signIn') : t('signUp')}
          </h1>
          <p className="text-[#43474c]">
            {isLogin ? t('signInSubtitle') : t('signUpSubtitle')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#c4c6cd]/20 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
              {success}
            </div>
          )}

          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[#c4c6cd]/30 rounded-lg hover:bg-[#edf4ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-[#1d2832]">{t('signInWithGoogle')}</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#c4c6cd]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#43474c]">{t('or')}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1d2832] mb-1">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-[#c4c6cd]/30 rounded-lg focus:ring-2 focus:ring-[#006c4d] focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1d2832] mb-1">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-[#c4c6cd]/30 rounded-lg focus:ring-2 focus:ring-[#006c4d] focus:border-transparent outline-none transition-all"
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1d2832] mb-1">
                  {t('confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-[#c4c6cd]/30 rounded-lg focus:ring-2 focus:ring-[#006c4d] focus:border-transparent outline-none transition-all"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-[#006c4d] hover:underline">
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#006c4d] text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {tc('processing')}
                </>
              ) : (
                <>
                  {isLogin ? t('signIn') : t('signUp')}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {!isLogin && (
            <p className="mt-4 text-xs text-center text-[#43474c]">
              {t('confirmEmail')}
            </p>
          )}

          <div className="mt-6 text-center text-sm text-[#43474c]">
            {isLogin ? (
              <>
                {t('noAccount')}{' '}
                <button
                  onClick={() => { setIsLogin(false); setError(null); }}
                  className="text-[#006c4d] hover:underline font-medium"
                >
                  {t('signUp')}
                </button>
              </>
            ) : (
              <>
                {t('haveAccount')}{' '}
                <button
                  onClick={() => { setIsLogin(true); setError(null); }}
                  className="text-[#006c4d] hover:underline font-medium"
                >
                  {t('signIn')}
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#43474c]">
          {t('byContinuing')}{' '}
          <Link href="/terms" className="text-[#1d2832] hover:underline">
            {t('termsOfService')}
          </Link>{' '}
          {t('and')}{' '}
          <Link href="/privacy" className="text-[#1d2832] hover:underline">
            {t('privacyPolicy')}
          </Link>
        </p>
      </main>
    </div>
  );
}
