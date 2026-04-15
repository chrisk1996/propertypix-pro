import { Header } from '@/components/Header';

export const metadata = {
  title: 'Terms of Service - Zestio',
  description: 'Terms of Service for Zestio',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <p className="text-gray-600 text-sm">Last updated: March 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By using Zestio, you agree to these terms. If you do not agree, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Subscription and Billing</h2>
            <p className="text-gray-600">
              Subscriptions are billed monthly. You may cancel at any time. Unused credits do not roll over.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Acceptable Use</h2>
            <p className="text-gray-600">
              You may not use our service for illegal purposes, to generate misleading content, or to infringe on others&apos; rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Intellectual Property</h2>
            <p className="text-gray-600">
              You retain ownership of your uploaded images. Generated content is yours to use for your business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Limitation of Liability</h2>
            <p className="text-gray-600">
              Zestio is provided as-is. We are not liable for any indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Changes to Terms</h2>
            <p className="text-gray-600">
              We may update these terms. Continued use constitutes acceptance of changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact</h2>
            <p className="text-gray-600">
              Questions? Contact us at{' '}
              <a href="mailto:legal@zestio.pro" className="text-indigo-600 hover:text-indigo-700">
                legal@zestio.pro
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
