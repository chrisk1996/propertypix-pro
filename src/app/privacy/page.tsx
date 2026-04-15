import { Header } from '@/components/Header';

export const metadata = {
  title: 'Privacy Policy - Zestio',
  description: 'Privacy Policy for Zestio',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <p className="text-gray-600 text-sm">Last updated: March 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="text-gray-600">
              We collect information you provide directly, including your name, email address, and uploaded images for processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-600">
              Your information is used to provide and improve our services, process your images, and communicate with you about your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Image Processing</h2>
            <p className="text-gray-600">
              Uploaded images are processed through our AI partners. Images are not stored permanently and are deleted after processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
            <p className="text-gray-600">
              We implement industry-standard security measures to protect your data. All transfers are encrypted using HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
            <p className="text-gray-600">
              You can request deletion of your data at any time by contacting us at privacy@zestio.ai
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact</h2>
            <p className="text-gray-600">
              For privacy questions, contact us at{' '}
              <a href="mailto:privacy@zestio.ai" className="text-indigo-600 hover:text-indigo-700">
                privacy@zestio.ai
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
