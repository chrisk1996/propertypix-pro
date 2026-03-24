'use client';

import { Header } from '@/components/Header';
import { Check, Sparkles, Building2, Zap, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
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
    name: 'Pro',
    price: '€19',
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
    ctaLink: '/auth',
    popular: false,
  },
];

export default function PricingPage() {
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
                <div className={`p-2 rounded-lg ${
                  plan.popular ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                }`}>
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
              <Link
                href={plan.ctaLink}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Feature Comparison</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-8 py-4 text-left text-sm font-medium text-gray-500">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Free</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-indigo-600">Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-8 py-4 text-gray-900">Enhancements/month</td>
                  <td className="px-6 py-4 text-center text-gray-600">5</td>
                  <td className="px-6 py-4 text-center font-medium text-indigo-600">100</td>
                  <td className="px-6 py-4 text-center text-gray-600">Unlimited</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-8 py-4 text-gray-900">Auto Enhance</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-gray-900">Sky Replacement</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-8 py-4 text-gray-900">Virtual Staging</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-gray-900">Object Removal</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-8 py-4 text-gray-900">HD Quality Output</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-gray-900">Priority Processing</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-8 py-4 text-gray-900">API Access</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-gray-900">Team Collaboration</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-8 py-4 text-gray-900">Custom Branding</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-gray-900">Watermark-free</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h3>
          <p className="text-gray-600 mb-6">
            Contact us at{' '}
            <a href="mailto:support@propertypix.pro" className="text-indigo-600 hover:underline">
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
