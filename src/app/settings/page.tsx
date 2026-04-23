'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Loader2, AlertCircle, User, Bell, Globe, Moon, Shield, LogOut, Key, Plus, Trash2, Copy, ExternalLink } from 'lucide-react';
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

  // API Keys state
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key_prefix: string; last_used_at: string | null; created_at: string; is_active: boolean }>>();
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadUser();
    loadApiKeys();
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

  const loadApiKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch {}
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    setRevealedKey(null);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');
      setRevealedKey(data.secret);
      setNewKeyName('');
      setShowCreateKey(false);
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Revoke this API key? Any apps using it will lose access.')) return;
    try {
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_id: keyId }),
      });
      if (!res.ok) throw new Error('Failed to revoke key');
      loadApiKeys();
    } catch {
      setError('Failed to revoke key');
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

        {/* API Keys Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                <p className="text-sm text-gray-500">Manage keys for external access</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/docs"
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                title="API Docs"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setShowCreateKey(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Key
              </button>
            </div>
          </div>

          {/* Create Key Form */}
          {showCreateKey && (
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. 'My App')"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                />
                <button
                  onClick={handleCreateKey}
                  disabled={creatingKey || !newKeyName.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
                <button
                  onClick={() => { setShowCreateKey(false); setNewKeyName(''); }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Revealed Key Banner */}
          {revealedKey && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-emerald-800 mb-2">🔑 Key created! Copy it now — it won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono text-slate-800 overflow-x-auto">{revealedKey}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(revealedKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copied && <span className="text-xs text-emerald-600 font-medium">Copied!</span>}
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="space-y-2">
            {apiKeys === undefined ? (
              <div className="text-center py-4 text-gray-400 text-sm">Loading keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No API keys yet</p>
                <p className="text-xs text-gray-400 mt-1">Create one to start using the API</p>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{key.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{key.key_prefix}{'••••••••'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {key.last_used_at
                          ? `Last used ${new Date(key.last_used_at).toLocaleDateString()}`
                          : 'Never used'}
                      </p>
                      <p className="text-xs text-gray-400">Created {new Date(key.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3">Maximum 5 active keys per account.</p>
        </div>

        {/* Credits & Billing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-[#006c4d]">account_balance_wallet</span>
            <div>
              <p className="font-medium text-gray-900">Credits & Billing</p>
              <p className="text-sm text-gray-500">Manage your subscription and top up credits</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <a href="/billing" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Manage Subscription</span>
              <span className="block mt-1 text-sm text-gray-900">Billing portal →</span>
            </a>
            <a href="/pricing" className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
              <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Buy Credits</span>
              <span className="block mt-1 text-sm text-gray-900">Top up packs →</span>
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
