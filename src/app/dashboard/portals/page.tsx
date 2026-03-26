'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import {
  Loader2,
  Link2,
  Unlink2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PortalCredential {
  id: string;
  portal_name: string;
  status: string;
  last_used_at: string | null;
  created_at: string;
  expires_at?: string;
}

const PORTAL_INFO: Record<string, {
  name: string;
  icon: string;
  description: string;
  requiresOAuth: boolean;
  website: string;
}> = {
  immobilienscout24: {
    name: 'ImmobilienScout24',
    icon: '🔍',
    description: 'Germanys largest real estate portal',
    requiresOAuth: true,
    website: 'https://www.immobilienscout24.de',
  },
  immowelt: {
    name: 'Immowelt',
    icon: '🏠',
    description: 'Popular German property portal',
    requiresOAuth: false,
    website: 'https://www.immowelt.de',
  },
  immonet: {
    name: 'Immonet',
    icon: '📱',
    description: 'Axel Springer real estate portal',
    requiresOAuth: false,
    website: 'https://www.immonet.de',
  },
  ebay_kleinanzeigen: {
    name: 'eBay Kleinanzeigen',
    icon: '🛒',
    description: 'Germanys biggest classifieds platform',
    requiresOAuth: true,
    website: 'https://www.ebay-kleinanzeigen.de',
  },
};

export default function PortalsPage() {
  const [credentials, setCredentials] = useState<PortalCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/portals/credentials');
      if (response.ok) {
        setCredentials(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (portal: string) => {
    setConnecting(portal);
    try {
      // Redirect to OAuth flow
      window.location.href = `/api/portals/connect?portal=${portal}`;
    } catch (error) {
      toast.error('Failed to initiate connection');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (portal: string) => {
    if (!confirm(`Disconnect from ${PORTAL_INFO[portal]?.name || portal}?`)) return;

    try {
      const response = await fetch(`/api/portals/disconnect?portal=${portal}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Disconnected successfully');
        fetchCredentials();
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const getCredential = (portal: string) => {
    return credentials.find((c) => c.portal_name === portal);
  };

  const isExpired = (cred: PortalCredential) => {
    if (!cred.expires_at) return false;
    return new Date(cred.expires_at) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Portal Connections</h1>
          <p className="text-gray-600 mt-1">
            Connect your real estate portal accounts to publish listings automatically.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(PORTAL_INFO).map(([portalKey, portal]) => {
            const credential = getCredential(portalKey);
            const isExpiredCred = credential && isExpired(credential);

            return (
              <div
                key={portalKey}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{portal.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{portal.name}</h3>
                      <p className="text-sm text-gray-500">{portal.description}</p>
                      {credential && (
                        <p className="text-xs text-gray-400 mt-1">
                          Connected{' '}
                          {new Date(credential.created_at).toLocaleDateString('de-DE')}
                          {credential.last_used_at && (
                            <> · Last used {new Date(credential.last_used_at).toLocaleDateString('de-DE')}</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {credential ? (
                      <>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                            isExpiredCred
                              ? 'bg-yellow-100 text-yellow-700'
                              : credential.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isExpiredCred ? (
                            <>
                              <AlertCircle className="w-4 h-4" />
                              Expired
                            </>
                          ) : credential.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Connected
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              {credential.status}
                            </>
                          )}
                        </span>
                        <a
                          href={portal.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title={`Visit ${portal.name}`}
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDisconnect(portalKey)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <Unlink2 className="w-4 h-4" />
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(portalKey)}
                        disabled={connecting === portalKey}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {connecting === portalKey ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4" />
                        )}
                        {connecting === portalKey ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• OAuth portals (ImmoScout24, eBay) require you to log in and authorize access.</li>
            <li>• Feed-based portals (Immowelt, Immonet) use our OpenImmo XML feed — no manual connection needed.</li>
            <li>• Connections expire after 90 days — reconnect if you see "Expired" status.</li>
          </ul>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard/listings"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Listings
          </Link>
        </div>
      </main>
    </div>
  );
}
