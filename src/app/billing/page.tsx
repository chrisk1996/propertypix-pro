'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { CreditCard, Loader2, AlertCircle, Check, Zap, Crown, Building2, ArrowUpRight, Calendar, Clock, XCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  email: string;
  plan: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  stripe_customer_id?: string;
  subscription_status?: string;
  subscription_current_period_end?: string;
  subscription_cancel_at?: string;
  subscription_canceled_at?: string;
}

// Use centralized pricing config so billing always matches pricing page
const planConfig = {
  free: { icon: Zap, color: 'text-gray-600 bg-gray-100' },
  pro: { icon: Crown, color: 'text-indigo-600 bg-indigo-100' },
  enterprise: { icon: Building2, color: 'text-amber-600 bg-amber-100' },
};

import { PLANS } from '@/lib/pricing';

const plans = Object.values(PLANS).map(p => ({
  id: p.name.toLowerCase(),
  name: p.name,
  price: p.priceLabel,
  period: p.period === 'forever' ? 'forever' : '/month',
  credits: p.credits,
  features: p.features,
  icon: planConfig[p.name.toLowerCase() as keyof typeof planConfig]?.icon || Zap,
  color: planConfig[p.name.toLowerCase() as keyof typeof planConfig]?.color || 'text-gray-600 bg-gray-100',
  popular: 'popular' in p ? p.popular : false,
}));

export default function BillingPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadUser();

    // Check for success/cancel params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      // Refresh to get updated subscription
      setTimeout(() => loadUser(), 2000);
    }
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        window.location.href = '/auth';
        return;
      }

      // Fetch user profile with credits from zestio_users table
      const { data: profile, error: profileError } = await supabase
        .from('zestio_users')
        .select('id, subscription_tier, credits, used_credits, stripe_customer_id, subscription_status, subscription_current_period_end, subscription_cancel_at, subscription_canceled_at')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setUser({
          email: authUser.email || '',
          plan: 'free',
          credits_total: 10,
          credits_used: 0,
          credits_remaining: 10,
        });
        return;
      }

      const creditsTotal = profile?.credits ?? 10;
      const creditsUsed = profile?.used_credits ?? 0;

      setUser({
        email: authUser.email || '',
        plan: profile?.subscription_tier || 'free',
        credits_total: creditsTotal,
        credits_used: creditsUsed,
        credits_remaining: Math.max(0, creditsTotal - creditsUsed),
        stripe_customer_id: profile?.stripe_customer_id,
        subscription_status: profile?.subscription_status,
        subscription_current_period_end: profile?.subscription_current_period_end,
        subscription_cancel_at: profile?.subscription_cancel_at,
        subscription_canceled_at: profile?.subscription_canceled_at,
      });
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load billing details');
    } finally {
      setLoading(false);
    }
  };

  const getCreditPercentage = () => {
    if (!user || user.credits_total <= 0) return 0;
    const total = user.credits_total || 1;
    return Math.max(0, Math.round((user.credits_remaining / total) * 100));
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubscribe = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      // If user already has a subscription, redirect to portal for prorated upgrade
      if (user?.plan !== 'free' && user?.stripe_customer_id) {
        // Open billing portal which handles prorated upgrades
        const response = await fetch('/api/stripe/portal', {
          method: 'POST',
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error || 'Failed to open billing portal');
        }
        return;
      }

      // New subscription - use checkout
      const priceIds: Record<string, string> = {
        pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro_test',
        enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_test',
      };

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, priceId: priceIds[plan] }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setCheckoutLoading('portal');
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open billing portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      setError('Failed to open billing portal');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleTopUp = async (credits: number) => {
    setCheckoutLoading(`topup-${credits}`);
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
        setError(data.error || 'Failed to start checkout');
      }
    } catch {
      setError('Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
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
  const isCancelAtPeriodEnd = user?.subscription_status === 'cancel_at_period_end';
  const isCanceled = user?.subscription_status === 'canceled';

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

        {/* Subscription Status Alert */}
        {isCancelAtPeriodEnd && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">Subscription Ending</p>
              <p className="text-yellow-700 text-sm mt-1">
                Your subscription will end on <strong>{formatDate(user?.subscription_current_period_end)}</strong>.
                You'll still have access until then. To reactivate, click Manage Subscription below.
              </p>
            </div>
          </div>
        )}

        {isCanceled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-gray-700 font-medium">Subscription Canceled</p>
              <p className="text-gray-600 text-sm mt-1">
                Your subscription was canceled on <strong>{formatDate(user?.subscription_canceled_at)}</strong>.
                You're now on the Free plan.
              </p>
            </div>
          </div>
        )}

        {/* Credits Overview Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-200 text-sm font-medium">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{currentPlan.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                  isCancelAtPeriodEnd ? 'bg-yellow-400/30 text-yellow-100' :
                  isCanceled ? 'bg-gray-400/30 text-gray-200' :
                  'bg-white/20'
                }`}>
                  {isCancelAtPeriodEnd ? 'Ending' : isCanceled ? 'Canceled' : 'Active'}
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
              <span className="text-lg font-bold">
                {`${user?.credits_remaining} / ${user?.credits_total}`}
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${getCreditPercentage()}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-indigo-200">
        <span>{user?.credits_used} used</span>
        <span>{`${getCreditPercentage()}% remaining`}</span>
      </div>
            </div>

      {/* Top Up Credits */}

          <div className="mt-4 bg-white/10 rounded-lg p-4">
            <span className="text-sm text-indigo-200 block mb-3">Need more credits?</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleTopUp(50)}
                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-all"
              >
                +50 cr / €9
              </button>
              <button
                onClick={() => handleTopUp(200)}
                className="flex-1 py-2 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white font-medium transition-all"
              >
                +200 cr / €29
              </button>
              <button
                onClick={() => handleTopUp(500)}
                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-all"
              >
                +500 cr / €59
              </button>
            </div>
      </div>

          {/* Subscription Details */}
          {user?.plan !== 'free' && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {user?.subscription_current_period_end && !isCancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-indigo-200">
                  <Calendar className="w-4 h-4" />
                  <span>Renews: {formatDate(user.subscription_current_period_end)}</span>
                </div>
              )}
              {user?.subscription_cancel_at && isCancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-yellow-200">
                  <Clock className="w-4 h-4" />
                  <span>Ends: {formatDate(user.subscription_cancel_at)}</span>
                </div>
              )}
            </div>
          )}

          {/* Manage Subscription Button */}
          {user?.plan !== 'free' && user?.stripe_customer_id && (
            <button
              onClick={handleManageSubscription}
              disabled={checkoutLoading === 'portal'}
              className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {checkoutLoading === 'portal' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {isCancelAtPeriodEnd ? 'Reactivate Subscription' : 'Manage Subscription'}
                </>
              )}
            </button>
          )}
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
                  className={`relative bg-white rounded-xl border-2 p-5 transition-shadow hover:shadow-md ${
                    isCurrent
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-gray-200'
                  } ${plan.popular && !isCurrent ? 'border-indigo-300' : ''}`}
                >
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Current
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

                  <p className="text-sm text-gray-600 mt-2">
                    {plan.credits} credits/month
                  </p>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  {plan.id !== 'free' && !isCurrent && (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={checkoutLoading === plan.id}
                      className={`mt-4 w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                        plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      } disabled:opacity-50`}
                    >
                      {checkoutLoading === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {user?.plan !== 'free' ? 'Switch Plan' : 'Subscribe'}
                          <ArrowUpRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
      </div>

        {/* Upgrade Info for existing subscribers */}
        {user?.plan !== 'free' && user?.stripe_customer_id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>💡 Upgrading?</strong> Click "Switch Plan" to open the billing portal where you can upgrade with prorated pricing. You'll only pay the difference for the remaining time in your billing cycle.
            </p>
          </div>
        )}

        {/* Stripe Test Mode Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>Test Mode:</strong> You're in Stripe test mode. Use test card number{' '}
            <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code> with any future expiry date and CVC.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
