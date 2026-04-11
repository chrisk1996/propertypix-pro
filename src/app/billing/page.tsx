'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CreditCard, Loader2, AlertCircle, Check, Zap, Crown, Building2, Download, ArrowUpRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  email: string;
  plan: string;
  plan_status: string;
  credits_remaining: number;
  credits_used: number;
  credits_total: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: 'forever',
    credits: 10,
    features: ['10 enhancements/month', 'Basic image enhancement', 'Standard support'],
    icon: Zap,
    color: 'text-gray-600 bg-gray-100',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€9',
    period: '/month',
    credits: 100,
    features: ['100 enhancements/month', 'All image tools', 'Virtual staging', '3D Floor plans', 'Priority support'],
    icon: Crown,
    color: 'text-indigo-600 bg-indigo-100',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '€99',
    period: '/month',
    credits: 'Unlimited',
    features: ['Unlimited enhancements', 'All Pro features', 'API access', 'Dedicated support', 'Custom integrations'],
    icon: Building2,
    color: 'text-amber-600 bg-amber-100',
  },
];

export default function BillingPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/auth';
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('propertypix_users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError) throw fetchError;
      setUser(data);
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load billing details');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
      setError('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const getCreditPercentage = () => {
    if (!user || user.plan === 'enterprise') return 100;
    const used = user.credits_used || 0;
    const total = user.credits_total || 100;
    return Math.max(0, Math.round(((total - used) / total) * 100));
  };

  const getCreditsUsed = () => {
    if (!user) return 0;
    return user.credits_used || 0;
  };

  const getCreditsRemaining = () => {
    if (!user) return 0;
    if (user.plan === 'enterprise') return '∞';
    return Math.max(0, (user.credits_total || 100) - (user.credits_used || 0));
  };

  if (loading) {
    return (
      <AppLayout title="Billing">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Billing & Credits">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Credits</h1>
          <p className="text-gray-600">Manage your subscription and credit usage</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Credits Overview Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-indigo-200 text-sm font-medium mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold capitalize">{user?.plan || 'Free'}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user?.plan_status === 'active'
                    ? 'bg-green-500/20 text-green-200'
                    : 'bg-yellow-500/20 text-yellow-200'
                }`}>
                  {user?.plan_status || 'active'}
                </span>
              </div>
            </div>
            {user?.plan !== 'enterprise' && (
              <Link
                href="/pricing"
                className="flex items-center gap-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
              >
                Upgrade <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Credits Progress */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Credits This Month</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{getCreditsRemaining()}</span>
                <span className="text-indigo-200 ml-1">remaining</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${getCreditPercentage()}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-2 text-sm text-indigo-200">
              <span>{getCreditsUsed()} used</span>
              <span>
                {user?.plan === 'enterprise' ? 'Unlimited' : `${user?.credits_total || 100} total`}
              </span>
            </div>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = user?.plan === plan.id;
              const Icon = plan.icon;
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-xl border-2 p-5 transition-all ${
                    isCurrentPlan
                      ? 'border-indigo-600 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.popular && !isCurrentPlan ? 'ring-2 ring-indigo-100' : ''}`}
                >
                  {plan.popular && !isCurrentPlan && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Current
                    </span>
                  )}

                  <div className={`w-10 h-10 rounded-lg ${plan.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-1 mb-3">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {!isCurrentPlan && (
                    <Link
                      href="/pricing"
                      className={`block w-full text-center py-2 rounded-lg text-sm font-medium transition-colors ${
                        plan.popular
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {user?.plan === 'enterprise' && plan.id !== 'enterprise' ? 'Downgrade' : 'Upgrade'}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing Management */}
        {user?.stripe_subscription_id && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Management</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Manage Payment Method
              </button>
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                View Invoices
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Update payment method, download invoices, or cancel your subscription via the Stripe portal.
            </p>
          </div>
        )}

        {/* Usage Stats */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Image Enhancements</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(getCreditsUsed() * 0.5)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Virtual Staging</p>
              <p className="text-2xl font-bold text-amber-600">{Math.floor(getCreditsUsed() * 0.2)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Video Creations</p>
              <p className="text-2xl font-bold text-red-600">{Math.floor(getCreditsUsed() * 0.15)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Floor Plans</p>
              <p className="text-2xl font-bold text-green-600">{Math.floor(getCreditsUsed() * 0.15)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Credits reset on the 1st of each month. Unused credits do not roll over.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
