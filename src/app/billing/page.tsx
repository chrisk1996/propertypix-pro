'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
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

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('propertypix_users')
        .select('id, email, plan, plan_status, stripe_customer_id, stripe_subscription_id')
        .eq('id', authUser.id)
        .single();

      // Fetch credits from enhancement_credits table
      const { data: credits } = await supabase
        .from('enhancement_credits')
        .select('credits_total, credits_used')
        .eq('user_id', authUser.id)
        .single();

      // Combine profile + credits
      setUser({
        email: profile?.email || authUser.email || '',
        plan: profile?.plan || 'free',
        plan_status: profile?.plan_status || 'active',
        credits_total: credits?.credits_total || 0,
        credits_used: credits?.credits_used || 0,
        credits_remaining: (credits?.credits_total || 0) - (credits?.credits_used || 0),
        stripe_customer_id: profile?.stripe_customer_id || null,
        stripe_subscription_id: profile?.stripe_subscription_id || null,
      });
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

  const currentPlan = plans.find(p => p.id === user?.plan) || plans[0];

  return (
    <AppLayout title="Billing">
      <div className="p-8 max-w-5xl">
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
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-200 text-sm font-medium">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{currentPlan.name}</span>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium uppercase">
                  {user?.plan_status || 'Active'}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <currentPlan.icon className="w-7 h-7" />
            </div>
          </div>

          {/* Credit Progress Bar */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-indigo-200">Credits Remaining</span>
              <span className="text-lg font-bold">{getCreditsRemaining()} / {user?.credits_total || 0}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${getCreditPercentage()}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-indigo-200">
              <span>{getCreditsUsed()} used</span>
              <span>{getCreditPercentage()}% remaining</span>
            </div>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = user?.plan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-xl border-2 p-5 ${
                    isCurrent
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-gray-200'
                  } ${plan.popular && !isCurrent ? 'border-indigo-300' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Current
                    </div>
                  )}
                  <div className={`w-12 h-12 ${plan.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{plan.credits} credits/month</p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing Management */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Billing Management</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Manage your payment method, view invoices, and cancel your subscription through the Stripe customer portal.
          </p>
          <button
            onClick={handleManageBilling}
            disabled={portalLoading || !user?.stripe_customer_id}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {portalLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                Open Billing Portal
              </>
            )}
          </button>
          {!user?.stripe_customer_id && (
            <p className="text-xs text-gray-500 mt-2">
              Billing portal available after subscribing to a paid plan.
            </p>
          )}
        </div>

        {/* Usage Breakdown */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Usage Breakdown</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Enhancements</p>
              <p className="text-2xl font-bold text-gray-900">{getCreditsUsed()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Virtual Staging</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">3D Floor Plans</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Videos</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
