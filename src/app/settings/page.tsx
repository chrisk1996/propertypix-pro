'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Loader2, AlertCircle, User, Bell, Globe, Moon, Shield, LogOut, Key, Plus, Trash2, Copy, ExternalLink } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { useTranslations } from 'next-intl';

interface UserData {
  email: string;
  full_name?: string;
  avatar_url?: string;
  language?: Locale;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
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
      setError(t('loadFailed'));
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
      setSuccess(t('languageSaved'));
      
      // Store in localStorage for immediate use
      localStorage.setItem('locale', newLanguage);
      
      // Reload page to apply new language
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error('Error updating language:', err);
      setError(t('languageSaveFailed'));
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

      setSuccess(t('profileSaved'));
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(t('profileSaveFailed'));
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
      if (!res.ok) throw new Error(data.error || t('loadFailed'));
      setRevealedKey(data.secret);
      setNewKeyName('');
      setShowCreateKey(false);
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadFailed'));
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm(t('revokeConfirm'))) return;
    try {
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_id: keyId }),
      });
      if (!res.ok) throw new Error(t('loadFailed'));
      loadApiKeys();
    } catch {
      setError(t('loadFailed'));
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
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
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
            <h2 className="text-lg font-semibold text-gray-900">{t('profile')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">{t('emailCannotChange')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('namePlaceholder')}
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
                  {t('saving')}...
                </span>
              ) : (
                t('saveChanges')
              )}
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">{t('preferences')}</h2>
          </div>

          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">{t('language')}</p>
                <p className="text-sm text-gray-500">{t('languageDesc')}</p>
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
                  <p className="font-medium text-gray-900">{t('darkMode')}</p>
                  <p className="text-sm text-gray-500">{t('darkModeDesc')}</p>
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
                  <p className="font-medium text-gray-900">{t('emailNotifications')}</p>
                  <p className="text-sm text-gray-500">{t('emailNotificationsDesc')}</p>
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
                <h2 className="text-lg font-semibold text-gray-900">{t('apiKeys')}</h2>
                <p className="text-sm text-gray-500">{t('apiKeysDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/docs"
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                title={t('apiDocs')}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setShowCreateKey(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {t('newKey')}
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
                  placeholder={t('keyNamePlaceholder')}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                />
                <button
                  onClick={handleCreateKey}
                  disabled={creatingKey || !newKeyName.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : t('create')}
                </button>
                <button
                  onClick={() => { setShowCreateKey(false); setNewKeyName(''); }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Revealed Key Banner */}
          {revealedKey && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-emerald-800 mb-2">{t('keyCreated')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono text-slate-800 overflow-x-auto">{revealedKey}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(revealedKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copied && <span className="text-xs text-emerald-600 font-medium">{t('copied')}</span>}
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="space-y-2">
            {apiKeys === undefined ? (
              <div className="text-center py-4 text-gray-400 text-sm">{t('loadingKeys')}</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('noApiKeys')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('noApiKeysDesc')}</p>
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
                          ? `${t("lastUsed")} ${new Date(key.last_used_at).toLocaleDateString()}`
                          : t('neverUsed')}
                      </p>
                      <p className="text-xs text-gray-400">{t('created')} {new Date(key.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title={t('revokeKey')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3">{t('maxKeys')}</p>
        </div>

        {/* Credits & Billing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-[#006c4d]">account_balance_wallet</span>
            <div>
              <p className="font-medium text-gray-900">{t('billing')}</p>
              <p className="text-sm text-gray-500">{t('billingDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <a href="/billing" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('manage')}</span>
              <span className="block mt-1 text-sm text-gray-900">{t('billingPortal')}</span>
            </a>
            <a href="/pricing" className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
              <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider">{t('buyCredits')}</span>
              <span className="block mt-1 text-sm text-gray-900">{t('topUpPacks')}</span>
            </a>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <LogOut className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">{t('signOut')}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {t('signOutDesc')}
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('signOut')}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
