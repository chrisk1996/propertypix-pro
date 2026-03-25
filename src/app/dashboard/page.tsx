'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sparkles, Image, Clock, Crown, CreditCard, Settings, Home, Video } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface CreditInfo {
  credits: number;
  plan: string;
  used: number;
  status: string;
}

export default function DashboardPage() {
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }
      const response = await fetch('/api/credits');
      const data = await response.json();
      setCredits(data);
    } catch (err) {
      console.error('Error loading credits:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCreditsDisplay = () => {
    if (!credits) return '...';
    if (credits.plan === 'enterprise') return '∞';
    return credits.credits.toString();
  };

  const getPlanBadge = () => {
    if (!credits) return null;
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      pro: 'bg-indigo-100 text-indigo-700',
      enterprise: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[credits.plan] || colors.free}`}>
        {credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1)}
      </span>
    );
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h1>
              <p className="text-gray-600">Manage your photo enhancements and account</p>
            </div>
            {getPlanBadge()}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Image className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-500">This month</span>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900">
                  {credits?.used || 0}/{getCreditsDisplay()}
                </h3>
                <p className="text-gray-600 text-sm">Enhancements used</p>
              </>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900">{getCreditsDisplay()}</h3>
                <p className="text-gray-600 text-sm">Credits remaining</p>
              </>
            )}
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

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link
              href="/enhance"
              className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Sparkles className="w-8 h-8 text-indigo-600" />
              <span className="font-medium text-indigo-700">Enhance Photo</span>
            </Link>
            <Link
              href="/staging"
              className="flex flex-col items-center justify-center gap-3 p-6 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
            >
              <Home className="w-8 h-8 text-teal-600" />
              <span className="font-medium text-teal-700">Virtual Staging</span>
      </Link>
      <Link href="/video" className="flex flex-col items-center justify-center gap-3 p-6 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
      >
      <Video className="w-8 h-8 text-rose-600" />
      <span className="font-medium text-rose-700">Create Video</span>
            </Link>
            <Link
              href="/history"
              className="flex flex-col items-center justify-center gap-3 p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
              <Clock className="w-8 h-8 text-green-600" />
              <span className="font-medium text-green-700">View History</span>
            </Link>
            <Link
              href="/pricing"
              className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <Crown className="w-8 h-8 text-purple-600" />
              <span className="font-medium text-purple-700">Upgrade Plan</span>
            </Link>
            <Link
              href="/settings"
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-8 h-8 text-gray-600" />
              <span className="font-medium text-gray-700">Settings</span>
            </Link>
          </div>
        </div>

        {/* Recent Enhancements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Enhancements</h2>
            <Link href="/history" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              View all
            </Link>
          </div>
          {recentEnhancements.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No enhancements yet</p>
              <Link
                href="/enhance"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
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

        {/* Upgrade CTA for free users */}
        {credits?.plan === 'free' && (
          <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
            <p className="opacity-90 mb-4">
              Get 100 enhancements/month, virtual staging, and priority processing.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              View Plans
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
