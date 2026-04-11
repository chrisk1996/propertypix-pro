'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import { locales, type Locale } from './config';

interface Props {
  children: ReactNode;
  initialLocale?: Locale;
  initialMessages?: Record<string, unknown>;
}

export function I18nProvider({ children, initialLocale = 'de', initialMessages }: Props) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>(initialMessages || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locale !== initialLocale) {
      setLoading(true);
      import(`../../locales/${locale}/common.json`)
        .then((mod) => {
          setMessages(mod.default);
        })
        .finally(() => setLoading(false));
    }
  }, [locale, initialLocale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

// Hook to change locale (used in settings)
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('de');

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    // Save to database
    try {
      const res = await fetch('/api/user/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  return { locale, setLocale };
}
