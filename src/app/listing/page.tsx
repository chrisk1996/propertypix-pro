'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  cold_rent?: number;
  warm_rent?: number;
  additional_costs?: number;
  deposit?: number;
  hoa_fees?: number;
  min_rental_period?: number;
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

interface ValidationWarning {
  field: string;
  message: string;
  severity: 'error' | 'warning';
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    createDraft();
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (!data.id) return;
    
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus('saving');
    
    // Debounce: wait 1.5s after last change
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/listings/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        setLastSaved(new Date());
        setSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
      }
    }, 1500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data]);

  // Validation
  useEffect(() => {
    const warnings: ValidationWarning[] = [];
    
    if (!data.title && data.city) {
      warnings.push({ field: 'title', message: 'Add a title to make your listing stand out', severity: 'warning' });
    }
    if (!data.city) {
      warnings.push({ field: 'city', message: 'Location is required for publishing', severity: 'error' });
    }
    if (data.transaction_type === 'sale' && !data.price) {
      warnings.push({ field: 'price', message: 'Price is required for sale listings', severity: 'error' });
    }
    if (data.transaction_type === 'rent' && !data.cold_rent) {
      warnings.push({ field: 'cold_rent', message: 'Cold rent is required for rental listings', severity: 'error' });
    }
    if (!data.living_area) {
      warnings.push({ field: 'living_area', message: 'Living area helps buyers compare properties', severity: 'warning' });
    }
    if (!data.rooms) {
      warnings.push({ field: 'rooms', message: 'Number of rooms is expected on portals', severity: 'warning' });
    }
    if (!data.energy_rating) {
      warnings.push({ field: 'energy_rating', message: 'Energy rating is legally required in Germany', severity: 'error' });
    }
    if (!data.description || data.description.length < 50) {
      warnings.push({ field: 'description', message: 'Description should be at least 50 characters', severity: 'warning' });
    }
    
    setValidationWarnings(warnings);
  }, [data]);

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
        setPreviewUrl(`${window.location.origin}/listing/${listing.listing.id}/preview`);
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
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [data.id]);

  const updateData = useCallback((newData: Partial<ListingData>) => {
    setData(prev => {
      const updated = { ...prev, ...newData };
      return updated;
    });
  }, []);

  const handlePublish = async () => {
    // Show validation before publish
    const errors = validationWarnings.filter(w => w.severity === 'error');
    if (errors.length > 0) {
      setShowValidation(true);
      return;
    }
    
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

  const copyPreviewLink = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
    }
  };

  const errorCount = validationWarnings.filter(w => w.severity === 'error').length;
  const warningCount = validationWarnings.filter(w => w.severity === 'warning').length;

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

              {/* Auto-save Indicator & Validation */}
              <div className="flex items-center gap-4 self-start">
                {/* Save Status */}
                <div className="flex items-center gap-2 text-xs font-medium">
                  {saveStatus === 'saving' && (
                    <span className="text-on-surface-variant animate-pulse">Saving...</span>
                  )}
                  {saveStatus === 'saved' && lastSaved && (
                    <span className="text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      Save failed
                    </span>
                  )}
                </div>

                {/* Validation Badge */}
                {validationWarnings.length > 0 && (
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                      errorCount > 0 
                        ? 'bg-error/10 text-error' 
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {errorCount > 0 ? 'error' : 'warning'}
                    </span>
                    {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : `${warningCount} warning${warningCount > 1 ? 's' : ''}`}
                  </button>
                )}

                {/* Preview Link */}
                {previewUrl && (
                  <button
                    onClick={copyPreviewLink}
                    className="flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    Copy Preview Link
                  </button>
                )}
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

            {/* Validation Warnings Panel */}
            {showValidation && validationWarnings.length > 0 && (
              <div className="mt-4 p-4 bg-surface-container-lowest rounded border border-outline-variant/20">
                <h4 className="font-bold text-sm mb-3 text-primary">Issues to fix before publishing:</h4>
                <div className="space-y-2">
                  {validationWarnings.map((warning, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2 text-sm ${
                        warning.severity === 'error' ? 'text-error' : 'text-warning'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm mt-0.5">
                        {warning.severity === 'error' ? 'error' : 'warning'}
                      </span>
                      <span><strong>{warning.field}:</strong> {warning.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <ListingPreviewPanel data={data} />
            </div>
          </div>

          {/* Publish Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handlePublish}
              disabled={errorCount > 0}
              className={`px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                errorCount > 0
                  ? 'bg-outline-variant/30 text-on-surface-variant/50 cursor-not-allowed'
                  : 'bg-secondary text-on-secondary hover:bg-secondary/90 shadow-lg'
              }`}
            >
              {errorCount > 0 ? `Fix ${errorCount} error${errorCount > 1 ? 's' : ''} to Publish` : 'Publish Listing'}
            </button>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
