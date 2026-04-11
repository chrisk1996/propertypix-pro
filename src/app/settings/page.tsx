'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  email: string;
  plan: string;
  plan_status: string;
  credits_remaining: number;
  credits_used: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/auth';
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('propertypix_users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError) throw fetchError;
      setUser(data);
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
      setError('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise',
    };
    return names[plan] || plan;
  };

  const getPlanPrice = (plan: string) => {
    const prices: Record<string, string> = {
      free: '€0',
      pro: '€9/month',
      enterprise: '€99/month',
    };
    return prices[plan] || '€0';
  };

  const getCreditsDisplay = () => {
    if (!user) return '0';
    if (user.plan === 'enterprise') return 'Unlimited';
    return `${user.credits_remaining}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600">Manage your subscription and billing</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Plan Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900">{getPlanName(user?.plan || 'free')}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  user?.plan_status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {user?.plan_status || 'active'}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{getPlanPrice(user?.plan || 'free')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Credits remaining</p>
              <p className="text-2xl font-bold text-indigo-600">{getCreditsDisplay()}</p>
            </div>
          </div>

          {user?.plan === 'free' && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-indigo-800 text-sm mb-3">
                Upgrade to Pro for 100 enhancements per month and premium features.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                Upgrade Plan
              </Link>
            </div>
          )}
        </div>

        {/* Billing Section */}
        {user?.stripe_subscription_id && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing</h2>
            
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Manage Billing
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Update payment method, view invoices, or cancel subscription.
            </p>
          </div>
        )}

        {/* Usage Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Enhancements Used</p>
              <p className="text-2xl font-bold text-gray-900">{user?.credits_used || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-2xl font-bold text-green-600">{getCreditsDisplay()}</p>
            </div>
          </div>

          {user?.plan !== 'enterprise' && (
            <p className="text-sm text-gray-500 mt-4">
              Credits reset on the 1st of each month.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
