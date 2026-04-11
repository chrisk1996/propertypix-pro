'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { ListingFeatures } from '@/types/listing';
import { Loader2, Check, ChevronRight, ChevronLeft, Sparkles, MapPin, Home, Camera, FileText, Settings, Rocket } from 'lucide-react';
import { AddressStep } from './steps/AddressStep';
import { BasicsStep } from './steps/BasicsStep';
import { MediaStep } from './steps/MediaStep';
import { DescriptionStep } from './steps/DescriptionStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { ReviewStep } from './steps/ReviewStep';
import { ListingPreview } from './ListingPreview';

export interface ListingData {
  id?: string;
  transaction_type: 'sale' | 'rent';
  property_type: 'apartment' | 'house' | 'commercial' | 'land';
  title: string;
  description: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  district: string;
  country: string;
  latitude?: number;
  longitude?: number;
  proximity_data?: Record<string, unknown>;
  price: number;
  cold_rent?: number;
  warm_rent?: number;
  additional_costs?: number;
  deposit?: number;
  hoa_fees?: number;
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
  availability_date?: string;
  is_immediately_available?: boolean;
  features: ListingFeatures;
  media_ids: string[];
  cover_image_id?: string;
}

const STEPS = [
  { id: 1, title: 'Address', subtitle: 'Location & enrichment', icon: MapPin, badge: 'auto' },
  { id: 2, title: 'Basics', subtitle: 'Property details', icon: Home, badge: 'required' },
  { id: 3, title: 'Media', subtitle: 'Photos & floor plan', icon: Camera, badge: 'ai' },
  { id: 4, title: 'Description', subtitle: 'AI-generated', icon: FileText, badge: 'ai' },
  { id: 5, title: 'Features', subtitle: 'Amenities', icon: Settings, badge: 'eu' },
  { id: 6, title: 'Publish', subtitle: 'Review & sync', icon: Rocket, badge: 'sync' },
];

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

export function ListingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<ListingData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    createDraft();
  }, []);

  const createDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...initialData, status: 'draft' }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({ ...prev, id: result.id }));
      }
    } catch (e) {
      console.error('Error creating draft:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const saveDraft = useCallback(async () => {
    if (!data.id) return;
    setIsSaving(true);
    try {
      await fetch(`/api/listings/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('Error saving draft:', e);
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  useEffect(() => {
    if (!data.id) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveDraft, 1500);
  }, [data, saveDraft]);

  const updateData = (updates: Partial<ListingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.has(step) || step === currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <AddressStep data={data} updateData={updateData} onNext={nextStep} />;
      case 2: return <BasicsStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 3: return <MediaStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 4: return <DescriptionStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 5: return <FeaturesStep data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 6: return <ReviewStep data={data} updateData={updateData} onPrev={prevStep} />;
      default: return null;
    }
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'auto': return 'bg-green-100 text-green-700';
      case 'ai': return 'bg-amber-100 text-amber-700';
      case 'required': return 'bg-red-100 text-red-700';
      case 'eu': return 'bg-red-100 text-red-700';
      case 'sync': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getBadgeText = (badge: string) => {
    switch (badge) {
      case 'auto': return 'Auto-filled';
      case 'ai': return 'AI-powered';
      case 'required': return 'Required';
      case 'eu': return 'EU Required';
      case 'sync': return 'Portal Sync';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-600 font-medium mb-1">
              PropertyPix Pro · New Listing
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create <em className="text-amber-600">Perfect</em> Listing
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            )}
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Steps */}
          <div className="w-72 flex-shrink-0">
            <div className="space-y-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep || completedSteps.has(step.id);
                const isAccessible = step.id <= currentStep || completedSteps.has(step.id) || step.id === currentStep + 1;

                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    disabled={!isAccessible}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-white border-2 border-amber-500 shadow-lg'
                        : isCompleted
                        ? 'bg-white border border-gray-200 hover:border-amber-300'
                        : 'bg-white/50 border border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Step Number Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                          {step.title}
                        </span>
                        {step.badge && (
                          <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${getBadgeStyle(step.badge)}`}>
                            {getBadgeText(step.badge)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{step.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress */}
            <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">{Math.round(((currentStep - 1) / 5) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center - Step Content */}
          <div className="flex-1 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Step Header Bar */}
              <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
              
              <div className="p-8">
                {renderStep()}
              </div>
            </div>
          </div>

          {/* Right - Live Preview */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
                  <p className="text-xs text-gray-500">Updates as you type</p>
                </div>
                <div className="p-4">
                  <ListingPreview data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
