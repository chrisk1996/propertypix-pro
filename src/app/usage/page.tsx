'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout';
import { useTranslations } from 'next-intl';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface UsageBreakdown {
  [feature: string]: number;
}

const featureColors: Record<string, string> = {
  Enhancement: 'bg-indigo-500',
  'Virtual Staging': 'bg-teal-500',
  Video: 'bg-purple-500',
  'Floor Plan': 'bg-amber-500',
  Other: 'bg-gray-400',
};

export default function UsagePage() {
  const t = useTranslations('usage');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [breakdown, setBreakdown] = useState<UsageBreakdown>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typeLabels: Record<string, { labelKey: string; color: string }> = {
    purchase: { labelKey: 'typeSubscription', color: 'text-blue-600 bg-blue-50' },
    topup: { labelKey: 'typeTopup', color: 'text-emerald-600 bg-emerald-50' },
    usage: { labelKey: 'typeUsage', color: 'text-orange-600 bg-orange-50' },
    refund: { labelKey: 'typeRefund', color: 'text-purple-600 bg-purple-50' },
    reset: { labelKey: 'typeReset', color: 'text-gray-600 bg-gray-50' },
    subscription: { labelKey: 'typeNewSubscription', color: 'text-blue-600 bg-blue-50' },
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/credits/transactions');
        if (!res.ok) throw new Error(t('loadFailed'));
        const data = await res.json();
        setTransactions(data.transactions || []);
        setBreakdown(data.breakdown || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : t('loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  const totalSpent = transactions.filter(tr => tr.amount < 0).reduce((sum, tr) => sum + tr.amount, 0);
  const totalGained = transactions.filter(tr => tr.amount > 0).reduce((sum, tr) => sum + tr.amount, 0);

  return (
    <AppLayout title={t('title')}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <h1 className="font-serif text-3xl text-[#1d2832] mb-6">{t('title')}</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{t('creditsSpent')}</span>
            <p className="text-2xl font-bold text-orange-600 mt-1">{Math.abs(totalSpent)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{t('creditsAdded')}</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">+{totalGained}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{t('transactions')}</span>
            <p className="text-2xl font-bold text-[#1d2832] mt-1">{transactions.length}</p>
          </div>
        </div>

        {/* Usage Breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">{t('usageBreakdown')}</h2>
            <div className="space-y-3">
              {Object.entries(breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([feature, credits]) => {
                  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? (credits / total) * 100 : 0;
                  return (
                    <div key={feature}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${featureColors[feature] || 'bg-gray-400'}`} />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                        <span className="font-medium text-gray-900">{credits} {t('creditsUnit')} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${featureColors[feature] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Transaction List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-xl p-6 text-center text-red-600">
            {error}
            <p className="text-sm text-red-400 mt-2">{t('tableHint')}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 block mb-3">receipt_long</span>
            <p className="text-gray-500">{t('noTransactions')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {transactions.map(tr => {
                const meta = typeLabels[tr.type] || { labelKey: tr.type, color: 'text-gray-600 bg-gray-50' };
                const label = t(meta.labelKey) || tr.type;
                return (
                  <div key={tr.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${meta.color}`}>
                        {label}
                      </span>
                      <div>
                        <p className="text-sm text-[#1d2832]">{tr.description || label}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(tr.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {['topup', 'purchase', 'subscription'].includes(tr.type) && (
                        <a
                          href={`/api/invoice?id=${tr.id}`}
                          target="_blank"
                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">receipt_long</span>
                          {t('invoice')}
                        </a>
                      )}
                      <span className={`font-medium text-sm ${tr.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {tr.amount > 0 ? '+' : ''}{tr.amount} {t('creditsUnit')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
