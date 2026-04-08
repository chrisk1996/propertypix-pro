'use client';

import { Header } from '@/components/Header';
import { Sparkles, Home, Image, ArrowRight, Check, Zap, Shield } from 'lucide-react';
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
            AI-Powered Real Estate Tools
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Everything You Need to
            <br />
            <span className="text-indigo-600">Sell Properties Faster</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Enhance photos, create 3D floor plans, and generate listing descriptions—all in one platform.
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
              href="/floorplan"
              className="flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-colors font-medium text-lg border border-gray-200"
            >
              <span className="material-symbols-outlined w-5 h-5">architecture</span>
              Create Floor Plan
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            No credit card required • 5 free enhancements/month
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              All-in-One Real Estate Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From photo enhancement to 3D floor plans—we've got everything covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Photo Enhancement */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-indigo-50 transition-colors">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Photo Enhancement</h3>
              <p className="text-gray-600">
                One-click AI enhancement for lighting, colors, and composition. Replace skies and remove unwanted objects.
              </p>
            </div>

            {/* Virtual Staging */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-green-50 transition-colors">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Home className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Virtual Staging</h3>
              <p className="text-gray-600">
                Fill empty rooms with beautiful virtual furniture. Help buyers envision the space.
              </p>
            </div>

            {/* 3D Floor Plans */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-purple-50 transition-colors">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-purple-600 text-2xl">architecture</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3D Floor Plans</h3>
              <p className="text-gray-600">
                Draw walls, add furniture, and see your floor plan come to life in stunning 3D.
              </p>
            </div>

            {/* Listing Builder */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-orange-50 transition-colors">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-orange-600 text-2xl">description</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Listing Builder</h3>
              <p className="text-gray-600">
                Generate listing descriptions with AI. Portal-ready data for IS24, ImmoWelt, and more.
              </p>
            </div>

            {/* Object Removal */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-blue-50 transition-colors">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Object Removal</h3>
              <p className="text-gray-600">
                Remove unwanted objects, people, or clutter from photos seamlessly.
              </p>
            </div>

            {/* Secure & Private */}
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

      {/* Floor Plan Showcase */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Create Professional 3D Floor Plans
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Draw your floor plan in 2D and instantly see it rendered in stunning 3D. 
                Add furniture, doors, windows, and export as GLB for use anywhere.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Draw walls, doors, and windows with simple tools</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Drag and drop furniture from a rich catalog</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Export as GLB, STL, or OBJ 3D models</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">2D/3D split view for precise editing</span>
                </li>
              </ul>
              <Link
                href="/floorplan"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <span className="material-symbols-outlined w-5 h-5">architecture</span>
                Try Floor Planner
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-purple-300">floor_plan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Listings?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join 500+ real estate agents already saving time and selling faster.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-100 transition-colors font-medium text-lg shadow-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-white font-bold text-sm">PP</span>
              </div>
              <span className="font-semibold text-white">PropertyPix Pro</span>
            </div>
            <div className="flex gap-6">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            © 2026 PropertyPix Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
