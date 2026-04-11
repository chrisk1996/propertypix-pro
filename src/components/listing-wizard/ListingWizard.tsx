'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ListingFeatures } from '@/types/listing';
import { Loader2, Check } from 'lucide-react';
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
  { id: 1, title: 'Address', subtitle: 'Location & enrichment', icon: 'edit_note' },
  { id: 2, title: 'Basics', subtitle: 'Property details', icon: 'home' },
  { id: 3, title: 'Media', subtitle: 'Photos & floor plan', icon: 'photo_library' },
  { id: 4, title: 'Description', subtitle: 'AI-generated', icon: 'auto_stories' },
  { id: 5, title: 'Features', subtitle: 'Amenities', icon: 'checklist' },
  { id: 6, title: 'Publish', subtitle: 'Review & launch', icon: 'rocket_launch' },
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

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-[#f7f9ff]/70 backdrop-blur-xl flex justify-between items-center px-10 py-5">
        <div className="flex items-center gap-12">
          <span className="text-2xl font-serif italic text-[#1d2832]">Property-Pix</span>
          <div className="hidden md:flex gap-8 items-center">
            <a className="text-[10px] uppercase tracking-widest text-[#1d2832]/60 hover:text-[#1d2832] transition-opacity" href="/dashboard">Dashboard</a>
            <a className="text-[10px] uppercase tracking-widest text-[#006c4d] border-b-2 border-[#006c4d] pb-1" href="/listing">Portfolio</a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {isSaving && (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          <button className="bg-[#1d2832] text-white px-5 py-2 text-sm font-medium hover:opacity-80 transition-opacity">
            Publish Listing
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex pt-20 min-h-screen">
        {/* Side Navigation */}
        <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] flex flex-col bg-[#edf4ff] w-72 border-r border-slate-200/50 overflow-y-auto">
          <div className="px-8 py-8">
            <h2 className="font-serif text-2xl text-[#1d2832]">Listing Builder</h2>
            <p className="text-xs text-[#43474c] mt-1">
              Step {currentStep} of 6: {STEPS[currentStep - 1]?.title}
            </p>
          </div>
          
          <div className="flex flex-col flex-1">
            {STEPS.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep || completedSteps.has(step.id);
              const isAccessible = step.id <= currentStep || completedSteps.has(step.id) || step.id === currentStep + 1;

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  disabled={!isAccessible}
                  className={`px-6 py-4 flex items-center gap-4 transition-all ${
                    isActive
                      ? 'bg-white text-[#006c4d] rounded-r-full shadow-sm translate-x-1'
                      : isCompleted
                      ? 'text-[#1d2832]/70 hover:bg-white/50'
                      : 'text-[#1d2832]/40 cursor-not-allowed'
                  }`}
                >
                  {isActive ? (
                    <span className="material-symbols-outlined text-[#006c4d]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {step.icon}
                    </span>
                  ) : isCompleted ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <span className="material-symbols-outlined text-[#1d2832]/30">
                      {step.icon}
                    </span>
                  )}
                  <div className="text-left">
                    <span className="font-medium text-sm block">{step.title}</span>
                    <span className="text-[10px] text-slate-400">{step.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-6 py-8 mt-auto border-t border-slate-200/50">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500">Progress</span>
              <span className="font-medium text-slate-700">{Math.round(((currentStep - 1) / 5) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#006c4d] transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
              />
            </div>
            <button className="w-full mt-4 bg-[#333e48] text-white py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Save Draft
            </button>
          </div>
        </aside>

        {/* Main Content - Split Pane */}
        <main className="flex-1 ml-72 flex overflow-hidden">
          {/* Left Pane: Form */}
          <div className="w-1/2 p-12 overflow-y-auto bg-[#f7f9ff]">
            <div className="max-w-xl mx-auto">
              {renderStep()}
            </div>
          </div>

          {/* Right Pane: Live Preview */}
          <div className="w-1/2 bg-[#edf4ff] p-12 overflow-y-auto">
            <ListingPreview data={data} />
          </div>
        </main>
      </div>
    </div>
  );
}
