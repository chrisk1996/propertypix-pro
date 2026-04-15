'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Loader2, AlertCircle, User, Bell, Globe, Moon, Shield, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

interface UserData {
  email: string;
  full_name?: string;
  avatar_url?: string;
  language?: Locale;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Locale>('de');

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
        .from('zestio_users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError) throw fetchError;

      setUser({
        email: authUser.email || '',
        full_name: data?.full_name || '',
        avatar_url: data?.avatar_url || '',
        language: data?.language || 'de',
      });
      setName(data?.full_name || '');
      setLanguage(data?.language || 'de');
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (newLanguage: Locale) => {
    setSavingLanguage(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error: updateError } = await supabase
        .from('zestio_users')
        .update({ language: newLanguage })
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      setLanguage(newLanguage);
      setSuccess('Language updated successfully');
      
      // Store in localStorage for immediate use
      localStorage.setItem('locale', newLanguage);
      
      // Reload page to apply new language
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error('Error updating language:', err);
      setError('Failed to update language');
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error: updateError } = await supabase
        .from('zestio_users')
        .update({ full_name: name })
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <AppLayout title="Settings">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings">
      <div className="p-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account preferences</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your name"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
          </div>

          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Language</p>
                <p className="text-sm text-gray-500">Choose your preferred language</p>
              </div>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as Locale)}
                  disabled={savingLanguage}
                  className="px-4 py-2 pr-10 border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[160px]"
                >
                  {locales.map((loc) => (
                    <option key={loc} value={loc}>
                      {localeFlags[loc]} {localeNames[loc]}
                    </option>
                  ))}
                </select>
                {savingLanguage && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-600" />
                )}
              </div>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-sm text-gray-500">Switch to dark theme</p>
                </div>
              </div>
              <button className="relative w-12 h-6 bg-gray-200 rounded-full transition-colors">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform" />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive updates about your account</p>
                </div>
              </div>
              <button className="relative w-12 h-6 bg-indigo-600 rounded-full transition-colors">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Billing Quick Link */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Billing & Credits</p>
                <p className="text-sm text-gray-500">Manage subscription and payment</p>
              </div>
            </div>
            <a
              href="/billing"
              className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Manage
            </a>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <LogOut className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Sign Out</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Sign out of your account on this device.
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
