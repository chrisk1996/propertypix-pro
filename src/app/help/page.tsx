import { Header } from '@/components/Header';
import Link from 'next/link';
import { Sparkles, Home, Video, Box } from 'lucide-react';

export const metadata = {
  title: 'Help & Support - PropertyPix Pro',
  description: 'Get help using PropertyPix Pro AI-powered real estate tools',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Help & Support</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg h-fit">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Photo Enhancement</h3>
                <p className="text-sm text-gray-600">Upload a property photo and select an enhancement type. AI will process your image in seconds.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="p-2 bg-teal-100 rounded-lg h-fit">
                <Home className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Virtual Staging</h3>
                <p className="text-sm text-gray-600">Add furniture to empty rooms. Select room type and style for realistic staging.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="p-2 bg-purple-100 rounded-lg h-fit">
                <Box className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">3D Floor Plans</h3>
                <p className="text-sm text-gray-600">Upload a floor plan image and get an interactive 3D visualization with furniture placement.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="p-2 bg-rose-100 rounded-lg h-fit">
                <Video className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Video Generation</h3>
                <p className="text-sm text-gray-600">Convert static photos into cinematic videos with smooth motion effects.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">How many credits do I need?</h3>
              <p className="text-sm text-gray-600 mt-1">Each enhancement uses 1 credit. Virtual staging and video generation also use 1 credit each.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">What image formats are supported?</h3>
              <p className="text-sm text-gray-600 mt-1">JPG, PNG, and WebP images up to 10MB are supported.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">How long does processing take?</h3>
              <p className="text-sm text-gray-600 mt-1">Most enhancements complete in 30-60 seconds. Videos may take up to 2 minutes.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-4">
            Contact our support team at{' '}
            <a href="mailto:support@propertypix.pro" className="text-indigo-600 hover:text-indigo-700">
              support@propertypix.pro
            </a>
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
