'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
      '3D Floor Plan Editor',
      'Export floor plans as JSON',
      'Community support',
    ],
    limitations: ['No virtual staging', 'No object removal', 'Watermark on downloads'],
    cta: 'Get Started Free',
    ctaLink: '/auth',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€29',
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
      '3D Floor Plans with GLB/STL export',
      'Listing Builder with AI descriptions',
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
    price: '€199',
    period: 'per month',
    description: 'For teams and agencies',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Unlimited photo enhancements',
      'All Pro features',
      'API access',
      'Team collaboration (up to 10 users)',
      'Custom branding',
      'White-label options',
      'Custom floor plan templates',
      'Priority support',
      'SLA guarantee',
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
    // TODO: Integrate with Stripe checkout
    // For now, redirect to auth
    setTimeout(() => {
      setLoading(null);
      window.location.href = '/auth';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-indigo-600 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-indigo-600 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.popular ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start gap-3 opacity-60">
                      <span className="w-5 h-5 flex-shrink-0 mt-0.5 text-center text-gray-400">✕</span>
                      <span className="text-gray-400">{limitation}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Feature Comparison
          </h2>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Free</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-indigo-600">Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Photo Enhancements', '5/month', '100/month', 'Unlimited'],
                  ['Auto Enhance', '✓', '✓', '✓'],
                  ['Sky Replacement', 'Basic', '✓', '✓'],
                  ['Virtual Staging', '—', '✓', '✓'],
                  ['Object Removal', '—', '✓', '✓'],
                  ['3D Floor Plan Editor', '✓', '✓', '✓'],
                  ['GLB/STL Export', '—', '✓', '✓'],
                  ['Listing Builder', '—', '✓', '✓'],
                  ['AI Descriptions', '—', '✓', '✓'],
                  ['Team Collaboration', '—', '—', '✓'],
                  ['API Access', '—', '—', '✓'],
                  ['Custom Branding', '—', '—', '✓'],
                ].map(([feature, free, pro, enterprise], i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-sm text-gray-900">{feature}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {free === '✓' ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : free}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 font-medium">
                      {pro === '✓' ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : pro}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {enterprise === '✓' ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I try before paying?</h3>
              <p className="text-gray-600">
                Yes! The Free plan gives you 5 enhancements per month at no cost. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What export formats are supported?</h3>
              <p className="text-gray-600">
                Floor plans can be exported as JSON (Free), or GLB/STL/OBJ 3D models (Pro and above).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll keep access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer custom plans?</h3>
              <p className="text-gray-600">
                Yes! Contact us for custom enterprise solutions tailored to your agency's needs.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
