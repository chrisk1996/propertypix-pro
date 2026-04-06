'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { ListingFeatures } from '@/types/listing';
import { ListingFormPanel } from '@/components/listing-builder/ListingFormPanel';
import { ListingPreviewPanel } from '@/components/listing-builder/ListingPreviewPanel';

interface ListingData {
  id?: string;
  transaction_type: 'sale' | 'rent';
  property_type: 'apartment' | 'house' | 'commercial' | 'land' | 'garage' | 'other';
  title: string;
  description: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  district: string;
  country: string;
  price: number;
  living_area: number;
  plot_area: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  total_floors: number;
  construction_year: number;
  energy_rating: string;
  heating_type: string;
  features: ListingFeatures;
  media_ids: string[];
  cover_image_id?: string;
}

const initialData: ListingData = {
  transaction_type: 'sale',
  property_type: 'apartment',
  title: '',
  description: '',
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
  district: '',
  country: 'Deutschland',
  price: 0,
  living_area: 0,
  plot_area: 0,
  rooms: 0,
  bedrooms: 0,
  bathrooms: 0,
  floor: 0,
  total_floors: 0,
  construction_year: 0,
  energy_rating: '',
  heating_type: '',
  features: {},
  media_ids: [],
};

export default function ListingBuilderPage() {
  const [data, setData] = useState<ListingData>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    createDraft();
  }, []);

  const createDraft = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...initialData, publish_status: 'draft' }),
      });
      if (response.ok) {
        const listing = await response.json();
        setData(prev => ({ ...prev, id: listing.listing.id }));
      }
    } catch (error) {
      console.error('Failed to create draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveProgress = useCallback(async (newData: Partial<ListingData>) => {
    if (!data.id) return;
    try {
      await fetch(`/api/listings/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [data.id]);

  const updateData = useCallback((newData: Partial<ListingData>) => {
    setData(prev => {
      const updated = { ...prev, ...newData };
      saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const handlePublish = async () => {
    if (!data.id) return;
    try {
      const response = await fetch(`/api/listings/${data.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portals: [] }),
      });
      if (response.ok) {
        window.location.href = `/dashboard/listings/${data.id}`;
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    if (!data.id) return;
    try {
      const response = await fetch(`/api/listings/${data.id}/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `listing-${data.id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  return (
    <AppLayout title="Listing Builder">
      <div className="min-h-screen bg-background">
        <main className="max-w-[1600px] mx-auto p-8">
          <header className="mb-12">
            <span className="text-secondary font-bold tracking-widest uppercase text-xs mb-2 block">
              Global Listing Suite
            </span>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-headline text-5xl text-primary font-bold tracking-tighter leading-none mb-4 italic">
                  Listing Builder
                </h1>
                <p className="max-w-xl text-on-surface-variant leading-relaxed font-body">
                  Optimize your property for Zillow, ImmobilienScout24, and beyond with comprehensive regional data fields and AI narrative generation.
                </p>
              </div>
              {/* Transaction Type Toggle */}
              <div className="bg-surface-container p-1 rounded-lg flex self-start">
                <button
                  onClick={() => updateData({ transaction_type: 'sale' })}
                  className={`px-6 py-2 rounded font-bold text-sm transition-all ${
                    data.transaction_type === 'sale'
                      ? 'bg-secondary text-on-secondary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  FOR SALE
                </button>
                <button
                  onClick={() => updateData({ transaction_type: 'rent' })}
                  className={`px-6 py-2 rounded font-bold text-sm transition-all ${
                    data.transaction_type === 'rent'
                      ? 'bg-secondary text-on-secondary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  TO RENT
                </button>
              </div>
              {/* Export Button */}
              <div className="flex gap-2 self-start">
                <select
                  onChange={e => handleExport(e.target.value as 'json' | 'csv' | 'pdf')}
                  className="bg-surface-container border border-outline-variant/30 rounded px-3 py-2 text-sm font-medium text-primary cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Export as...</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-7">
              <ListingFormPanel
                data={data}
                updateData={updateData}
                isSaving={isSaving}
              />
            </div>
            <div className="col-span-12 lg:col-span-5">
              <ListingPreviewPanel
                data={data}
                onPublish={handlePublish}
              />
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
