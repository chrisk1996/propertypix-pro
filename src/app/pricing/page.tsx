import { Header } from '@/components/Header';
import Link from 'next/link';
import { PLANS, CREDIT_BREAKDOWN, TOP_UP_PACKS } from '@/lib/pricing';

export const metadata = {
  title: 'Pricing - Zestio',
  description: 'Simple credit-based pricing for Zestio AI real estate tools',
};

export default function PricingPage() {
  const plansList = Object.values(PLANS);

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-[#1d2832] mb-4">
            Simple Credit-Based Pricing
          </h1>
          <p className="text-xl text-[#43474c] max-w-2xl mx-auto">
            Buy credits, use them across all tools. No hidden fees, no surprises.
          </p>
        </div>

        {/* Credit costs */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6 text-center">What Credits Buy</h2>
          <div className="bg-white rounded-xl border border-[#c4c6cd]/20 overflow-hidden">
            {CREDIT_BREAKDOWN.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-6 py-4 ${i < CREDIT_BREAKDOWN.length - 1 ? 'border-b border-[#c4c6cd]/10' : ''}`}
              >
                <div>
                  <span className="font-medium text-[#1d2832]">{item.action}</span>
                  <span className="block text-xs text-[#43474c]">{item.note}</span>
                </div>
                <span className={`font-manrope text-sm font-bold ${item.cost === 0 ? 'text-[#006c4d]' : 'text-[#1d2832]'}`}>
                  {item.cost === 0 ? 'Free' : `${item.cost} credit${item.cost > 1 ? 's' : ''}`}
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
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h2 className="font-serif text-2xl text-[#1d2832] mb-1">{plan.name}</h2>
                <p className="text-sm text-[#43474c] mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#1d2832]">{plan.priceLabel}</span>
                  <span className="text-[#43474c] ml-2">{plan.period}</span>
                  <span className="block text-sm text-[#006c4d] font-medium mt-1">
                    {plan.credits} credits/month
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-sm text-[#006c4d] mt-0.5">check</span>
                      <span className="text-sm text-[#43474c]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === 'Enterprise' ? 'mailto:sales@zestio.pro?subject=Enterprise Plan Inquiry' : '/auth'}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-all ${
                    plan.popular
                      ? 'bg-[#006c4d] text-white hover:opacity-90'
                      : 'bg-[#edf4ff] text-[#1d2832] hover:bg-[#e3efff]'
                  }`
                }
                >
                  {plan.name === 'Free' ? 'Get Started Free' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Pro Trial'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Top-up Packs */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl text-[#1d2832] mb-2">Need More Credits?</h2>
            <p className="text-[#43474c]">Top up anytime — credits never expire within your billing period.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TOP_UP_PACKS.map((pack) => (
              <div
                key={pack.credits}
                className={`bg-white rounded-xl p-6 border text-center ${
                  pack.popular ? 'border-[#006c4d] ring-1 ring-[#006c4d]/20' : 'border-[#c4c6cd]/20'
                }`}
              >
                <h3 className="font-medium text-[#1d2832] mb-1">{pack.label}</h3>
                <span className="text-2xl font-bold text-[#1d2832]">{pack.priceLabel}</span>
                <span className="block text-xs text-[#43474c] mt-1">{pack.perCredit}/credit</span>
                <button
                  className="mt-4 w-full py-2 bg-[#edf4ff] text-[#1d2832] rounded-lg text-sm font-medium hover:bg-[#e3efff] transition-all"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-8 text-center">Pricing FAQ</h2>
          <div className="space-y-3">
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                How many videos can I make with 100 credits?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">Each video costs 5 credits. With Pro (100 credits) you can make 20 videos per month. Enterprise (500 credits) gives you 100 videos.</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                Do credits roll over?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">Credits reset each billing cycle. Unused credits don&apos;t roll over to the next month.</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                Can I cancel anytime?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">Yes. Cancel anytime and you&apos;ll keep access until the end of your billing period. No cancellation fees.</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                What if I run out of credits?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">You can buy top-up packs anytime — 50, 200, or 500 credits. No need to upgrade your plan.</p>
            </details>
            <details className="bg-white rounded-lg border border-[#c4c6cd]/20 p-6 group">
              <summary className="font-medium text-[#1d2832] cursor-pointer list-none flex justify-between items-center">
                What&apos;s free?
                <span className="material-symbols-outlined text-[#43474c] text-sm group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-sm text-[#43474c] mt-3">AI listing descriptions, smart captions, and the social media kit are completely free — no credits needed. The free plan also gives you 5 credits to try paid features.</p>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
