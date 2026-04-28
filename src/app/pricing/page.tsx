'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { PLANS, CREDIT_BREAKDOWN, TOP_UP_PACKS } from '@/lib/pricing';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';

export default function PricingPage() {
  const t = useTranslations('pricing');
  const [loadingPack, setLoadingPack] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
      if (data.user) {
        fetch('/api/credits').then(r => r.json()).then(d => setCurrentPlan(d.plan || 'free')).catch(() => {});
      }
    });
  }, []);

  const handleTopUp = async (credits: number) => {
    setLoadingPack(credits);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topUpCredits: credits }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || t('startCheckoutFailed'));
      }
    } catch {
      alert(t('startCheckoutFailed'));
    } finally {
      setLoadingPack(null);
    }
  };

  const plansList = Object.values(PLANS);

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-[#1d2832] mb-4">
            {t('simpleCreditPricing')}
          </h1>
          <p className="text-xl text-[#43474c] max-w-2xl mx-auto">
            {t('subtitle2')}
          </p>
        </div>

        {/* Credit costs */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6 text-center">{t('whatCreditsBuy')}</h2>
          <div className="bg-white rounded-xl border border-[#c4c6cd]/20 overflow-hidden">
            {CREDIT_BREAKDOWN.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-6 py-4 ${i < CREDIT_BREAKDOWN.length - 1 ? 'border-b border-[#c4c6cd]/10' : ''}`}
              >
                <div>
                  <span className="font-medium text-[#1d2832]">{t(item.actionKey)}</span>
                  <span className="block text-xs text-[#43474c]">{t(item.noteKey)}</span>
                </div>
                <span className={`font-manrope text-sm font-bold ${item.cost === 0 ? 'text-[#006c4d]' : 'text-[#1d2832]'}`}>
                  {item.cost === 0 ? t('freeCredit') : `${item.cost} ${item.cost > 1 ? t('creditPlural') : t('creditSingular')}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plansList.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl overflow-hidden border ${
                plan.popular
                  ? 'border-[#006c4d] ring-2 ring-[#006c4d]/20 scale-[1.02]'
                  : 'border-[#c4c6cd]/20'
              }`}
            >
              {plan.popular && (
                <div className="bg-[#006c4d] text-white text-center py-2 text-xs font-manrope uppercase tracking-widest">
                  {t('mostPopular')}
                </div>
              )}
              <div className="p-8">
                <h2 className="font-serif text-2xl text-[#1d2832] mb-1">{t(plan.nameKey)}</h2>
                <p className="text-sm text-[#43474c] mb-6">{t(plan.descriptionKey)}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#1d2832]">{plan.priceLabel}</span>
                  <span className="text-[#43474c] ml-2">{t(plan.periodKey)}</span>
                  <span className="block text-sm text-[#006c4d] font-medium mt-1">
                    {plan.credits} {t('creditsPerMonth')}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-sm text-[#006c4d] mt-0.5">check</span>
                      <span className="text-sm text-[#43474c]">{t(feature)}</span>
                    </li>
                  ))}
                </ul>

                {currentPlan === plan.nameKey ? (
                  <div className="block w-full text-center py-3 rounded-lg font-medium bg-[#f0fdf4] text-[#006c4d] border border-[#006c4d]/20">
                    {t('currentPlanLabel')}
                  </div>
                ) : (
                  <Link
                    href={isLoggedIn ? '/billing' : '/auth'}
                    className={`block w-full text-center py-3 rounded-lg font-medium transition-all ${
                      plan.popular
                        ? 'bg-[#006c4d] text-white hover:opacity-90'
                        : 'bg-[#edf4ff] text-[#1d2832] hover:bg-[#e3efff]'
                    }`}
                  >
                    {plan.nameKey === 'free' ? (isLoggedIn ? t('goToDashboard') : t('getStartedFree')) : plan.nameKey === 'enterprise' ? (isLoggedIn ? t('switchPlan') : t('startEnterpriseTrial')) : (isLoggedIn ? t('switchPlan') : t('startProTrial'))}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Top-up Packs */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl text-[#1d2832] mb-2">{t('needMoreCredits')}</h2>
            <p className="text-[#43474c]">{t('needMoreCreditsDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TOP_UP_PACKS.map((pack) => (
              <div
                key={pack.credits}
                className={`bg-white rounded-xl p-6 border text-center ${
                  pack.popular ? 'border-[#006c4d] ring-1 ring-[#006c4d]/20' : 'border-[#c4c6cd]/20'
                }`}
              >
                <h3 className="font-medium text-[#1d2832] mb-1">{t(pack.labelKey)}</h3>
                <span className="text-2xl font-bold text-[#1d2832]">{pack.priceLabel}</span>
                <span className="block text-xs text-[#43474c] mt-1">{pack.perCredit}/{t('creditSingular')}</span>
                <button
                  onClick={() => handleTopUp(pack.credits)}
                  disabled={loadingPack !== null}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-all ${
                    loadingPack === pack.credits
                      ? 'bg-[#006c4d] text-white opacity-75'
                      : 'bg-[#edf4ff] text-[#1d2832] hover:bg-[#e3efff]'
                  }`}
                >
                  {loadingPack === pack.credits ? t('redirecting') : t('buyNow')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-8 text-center">{t('pricingFaq')}</h2>
          <div className="space-y-3">
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                {t('faq1Q')}
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">{t('faq1A')}</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                {t('faq2Q')}
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">{t('faq2A')}</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                {t('faq3Q')}
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">{t('faq3A')}</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                {t('faq4Q')}
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">{t('faq4A')}</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                {t('faq5Q')}
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">{t('faq5A')}</p>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
