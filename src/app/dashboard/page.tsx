'use client';

import { Header } from '@/components/Header';
import { Sparkles, Image, Clock, TrendingUp, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Stub data - would come from Supabase in production
  const user = {
    name: 'Agent',
    email: 'agent@example.com',
    plan: 'free',
    creditsUsed: 3,
    creditsTotal: 5,
  };

  const recentEnhancements = [
    { id: '1', type: 'auto', date: '2 hours ago' },
    { id: '2', type: 'sky', date: '1 day ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-600">Manage your photo enhancements and account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Image className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-500">This month</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{user.creditsUsed}/{user.creditsTotal}</h3>
            <p className="text-gray-600 text-sm">Enhancements used</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">847</h3>
            <p className="text-gray-600 text-sm">Total enhancements</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">~45s</h3>
            <p className="text-gray-600 text-sm">Avg. processing time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/enhance" className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              <span className="font-medium text-indigo-700">Enhance Photo</span>
            </Link>
            <Link href="/pricing" className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <Crown className="w-8 h-8 text-purple-600" />
              <span className="font-medium text-purple-700">Upgrade Plan</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Enhancements</h2>
            <Link href="/history" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View all</Link>
          </div>

          {recentEnhancements.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No enhancements yet</p>
              <Link href="/enhance" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Sparkles className="w-4 h-4" />
                Enhance your first photo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentEnhancements.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900 capitalize">{item.type} Enhancement</p>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {user.plan === 'free' && (
          <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
            <p className="opacity-90 mb-4">Get 100 enhancements/month, virtual staging, and priority processing.</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              View Plans
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
