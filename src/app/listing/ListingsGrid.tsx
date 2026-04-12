'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

interface Listing {
  id: string;
  title: string;
  city: string;
  property_type: string;
  transaction_type: string;
  price: number;
  living_area: number;
  rooms: number;
  publish_status: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

export default function ListingsGrid() {
  const supabase = createClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setListings(data);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (cents: number, type: string) => {
    if (!cents) return 'Price on request';
    const price = cents / 100;
    const formatted = new Intl.NumberFormat('de-DE').format(price);
    return type === 'rent' ? `€${formatted}/mo` : `€${formatted}`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);
    if (!error) {
      setListings(listings.filter(l => l.id !== id));
    }
  };

  const filteredListings = filter === 'all' 
    ? listings 
    : listings.filter(l => l.publish_status === filter);

  const getStatusBadge = (status: string) => {
    if (status === 'published') {
      return 'bg-emerald-100 text-emerald-700';
    }
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="p-8">
      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-6">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
            filter === 'all' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Listings
        </button>
        <button 
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
            filter === 'draft' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Drafts
        </button>
        <button 
          onClick={() => setFilter('published')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
            filter === 'published' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Published
        </button>

        <div className="ml-auto flex items-center gap-2 text-slate-400">
          <span className="text-xs font-semibold mr-2">Sort by:</span>
          <button className="flex items-center gap-1 text-xs font-bold text-slate-900">
            Last Modified
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p>Loading listings...</p>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Add New Listing Card */}
          <Link 
            href="/listing/new" 
            className="group relative aspect-[4/5] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-[#006c4d] hover:bg-emerald-50/50 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-slate-600 text-2xl">add_home</span>
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-600">
              Create New Listing
            </span>
          </Link>

          {/* Listing Cards */}
          {filteredListings.map((listing) => (
            <div key={listing.id} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-100 mb-4">
                {/* Cover Image */}
                {listing.cover_image_url ? (
                  <Image 
                    src={listing.cover_image_url} 
                    alt={listing.title || 'Property'} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-slate-400">home</span>
                  </div>
                )}

                {/* Status Badge */}
                <div className={`absolute top-3 right-3 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(listing.publish_status)}`}>
                  {listing.publish_status}
                </div>

                {/* Price Badge */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md">
                  <span className="font-serif font-bold text-sm text-slate-900">
                    {formatPrice(listing.price, listing.transaction_type)}
                  </span>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                  <Link 
                    href={`/listing/${listing.id}`} 
                    className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                    title="Edit listing"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </Link>
                  {listing.publish_status === 'published' && (
                    <button 
                      className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                      title="View live"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Listing Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">
                    {listing.title || 'Untitled Listing'}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {listing.city || 'No location'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {listing.rooms > 0 && `${listing.rooms} rooms · `}
                    {listing.living_area > 0 && `${listing.living_area} m²`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Modified {formatDate(listing.updated_at)}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(listing.id)}
                  className="material-symbols-outlined text-slate-300 hover:text-red-500 transition-colors"
                >
                  delete
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredListings.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 block">home_work</span>
              <p>No listings yet. Create your first property listing!</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Meta */}
      {listings.length > 0 && (
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-semibold">
            Displaying {filteredListings.length} of {listings.length} Listings
          </p>
        </div>
      )}
    </div>
  );
}
