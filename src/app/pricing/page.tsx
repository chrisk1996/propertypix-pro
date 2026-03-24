'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Check, Sparkles, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: 'forever',
    description: 'Perfect for trying out PropertyPix Pro',
    icon: <Zap className="w-6 h-6" />,
    features: [
      '5 photo enhancements per month',
      'Auto enhance feature',
      'Basic sky replacement',
      'Standard quality output',
      'Community support',
    ],
    limitations: [
      'No virtual staging',
      'No object removal',
      'Watermark on downloads',
    ],
    cta: 'Get Started Free',
    ctaLink: '/auth',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€9',
    period: 'per month',
    description: 'For serious real estate professionals',
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      '100 photo enhancements per month',
      'All enhancement types',
      'Virtual staging included',
      'Object removal',
      'HD quality output',
      'Priority processing',
      'Email support',
      'No watermarks',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    ctaLink: '/auth',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '€99',
    period: 'per month',
    description: 'For teams and agencies',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Unlimited photo enhancements',
      'All Pro features',
      'API access',
      'Team collaboration',
      'Custom branding',
      'White-label options',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
      'Onboarding support',
    ],
    limitations: [],
    cta: 'Contact Sales',
    ctaLink: 'mailto:sales@propertypix.pro',
    popular: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleCheckout = async (planId: string) => {
    if (planId === 'free') {
      window.location.href = '/auth';
      return;
    }

    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@propertypix.pro?subject=Enterprise Plan Inquiry';
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to auth with return URL
        window.location.href = `/auth?redirect=/pricing&plan=${planId}`;
        return;
      }

      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include our core AI enhancement features.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm border-2 ${
                plan.popular
                  ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2'
                  : 'border-gray-200'
              } p-8 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-lg ${
                    plan.popular
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {plan.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
              </div>

              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 ml-2">{plan.period}</span>
              </div>

              <p className="text-gray-600 mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-start gap-3 opacity-60">
                    <span className="w-5 h-5 flex-shrink-0 mt-0.5 text-center text-gray-400">×</span>
                    <span className="text-gray-500">{limitation}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } ${loading === plan.id ? 'opacity-75 cursor-wait' : ''}`}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="text-center mb-12">
          <p className="text-gray-500 text-sm mb-4">Trusted by real estate professionals</p>
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Secure payments via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>No hidden fees</span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h3>
          <p className="text-gray-600 mb-6">
            Contact us at{' '}
            <a
              href="mailto:support@propertypix.pro"
              className="text-indigo-600 hover:underline"
            >
              support@propertypix.pro
            </a>
          </p>
          <Link
            href="/enhance"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Try Free Enhancement
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
