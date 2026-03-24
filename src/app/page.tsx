'use client';

import { Header } from '@/components/Header';
import { Sparkles, Home, Image, ArrowRight, Play, Check, Users, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Real Estate Photography
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Property
            <br />
            <span className="text-indigo-600">Photos with AI</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Enhance, stage, and perfect your real estate photos in seconds. 
            Get stunning results that sell properties faster.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/enhance"
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-lg shadow-lg shadow-indigo-200"
            >
              <Sparkles className="w-5 h-5" />
              Try Free Enhancement
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-colors font-medium text-lg border border-gray-200"
            >
              View Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            No credit card required • 5 free enhancements/month
          </p>
        </div>

        {/* Hero Preview */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-1">
            <div className="bg-white rounded-xl p-4">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                  <p className="text-gray-600">Before/After Preview</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute -left-4 top-1/4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2 hidden md:flex">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">Sky Replacement</span>
          </div>
          <div className="absolute -right-4 top-1/3 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2 hidden md:flex">
            <Home className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Virtual Staging</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Sell Faster
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-quality photo enhancements without the professional price tag
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-indigo-50 transition-colors">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Auto Enhance</h3>
              <p className="text-gray-600">
                One-click AI enhancement that adjusts lighting, colors, and composition automatically.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-green-50 transition-colors">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Home className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Virtual Staging</h3>
              <p className="text-gray-600">
                Fill empty rooms with beautiful virtual furniture to help buyers envision the space.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-orange-50 transition-colors">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Image className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sky Replacement</h3>
              <p className="text-gray-600">
                Replace dull, gray skies with stunning blue skies and dramatic sunsets instantly.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-purple-50 transition-colors">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Object Removal</h3>
              <p className="text-gray-600">
                Remove unwanted objects, people, or clutter from photos seamlessly.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-blue-50 transition-colors">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
              <p className="text-gray-600">
                Share projects with team members and manage enhancements together.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-red-50 transition-colors">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                Your photos are processed securely and never used for training without consent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to stunning property photos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Your Photo</h3>
              <p className="text-gray-600">
                Drag and drop or select your property photo. Supports JPG, PNG, and WebP.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Choose Enhancement</h3>
              <p className="text-gray-600">
                Select auto enhance, sky replacement, virtual staging, or object removal.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Download Result</h3>
              <p className="text-gray-600">
                Preview the before/after and download your enhanced photo in HD quality.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/enhance"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-lg"
            >
              <Play className="w-5 h-5" />
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Listings?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of real estate professionals using PropertyPix Pro
          </p>
          <Link
            href="/enhance"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-100 transition-colors font-medium text-lg"
          >
            <Play className="w-5 h-5" />
            Start Enhancing Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold">PropertyPix Pro</span>
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/enhance" className="hover:text-white transition-colors">Enhance</Link>
              <a href="mailto:support@propertypix.pro" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            © 2024 PropertyPix Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
