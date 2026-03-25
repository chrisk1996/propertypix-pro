'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Loader2, Edit, Trash2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Listing {
  id: string;
  transaction_type: string;
  property_type: string;
  title: string;
  description: string;
  city: string;
  price: number;
  publish_status: string;
  created_at: string;
}

interface SyndicationLog {
  id: string;
  portal: string;
  status: string;
  portal_url?: string;
  error_message?: string;
  attempted_at: string;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [logs, setLogs] = useState<SyndicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchListing();
    fetchLogs();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${listingId}`);
      if (response.ok) {
        const data = await response.json();
        setListing(data);
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/syndication/${listingId}`);
      if (response.ok) {
        setLogs(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      router.push('/dashboard/listings');
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatPrice = (cents?: number) => {
    if (!cents) return 'Price on request';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-blue-100 text-blue-700',
    };
    return styles[status] || styles.draft;
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

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>Listing not found</p>
          <Link href="/dashboard/listings" className="text-indigo-600 hover:underline">
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(listing.publish_status)}`}>
                  {listing.publish_status}
                </span>
                <span className="text-sm text-gray-500 capitalize">
                  {listing.transaction_type} • {listing.property_type}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {listing.title || 'Untitled Listing'}
              </h1>
              <p className="text-gray-600">{listing.city}</p>
              <p className="text-2xl font-semibold text-indigo-600 mt-2">
                {formatPrice(listing.price)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/listings/${listingId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Syndication Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portal Status</h2>
          
          {logs.length === 0 ? (
            <p className="text-gray-500">Not published to any portals yet.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {log.portal === 'openimmo' ? '🏠' : log.portal === 'immoscout24' ? '🔍' : '📱'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{log.portal}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.attempted_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        log.status === 'posted'
                          ? 'bg-green-100 text-green-700'
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {log.status}
                    </span>
                    {log.portal_url && (
                      <a
                        href={log.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {listing.description || 'No description provided.'}
          </p>
        </div>
      </main>
    </div>
  );
}
