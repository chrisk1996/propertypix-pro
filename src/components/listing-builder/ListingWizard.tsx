'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { WizardProgressBar } from './WizardProgressBar';
import { Step1PropertyType } from './Step1PropertyType';
import { Step2Location } from './Step2Location';
import { Step3Details } from './Step3Details';
import { Step4Features } from './Step4Features';
import { Step5Description } from './Step5Description';
import { Step6Media } from './Step6Media';
import { Step7Publish } from './Step7Publish';
import { ListingFeatures } from '@/types/listing';
import { Loader2 } from 'lucide-react';

export interface ListingData {
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

const STEPS = [
  'Property Type',
  'Location',
  'Details',
  'Features',
  'Description',
  'Media',
  'Publish',
];

interface ListingWizardProps {
  listingId?: string;
}

export function ListingWizard({ listingId }: ListingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = parseInt(searchParams.get('step') || '1', 10);

  const [currentStep, setCurrentStep] = useState(Math.max(1, Math.min(7, initialStep)));
  const [data, setData] = useState<ListingData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!listingId);

  useEffect(() => {
    if (listingId) {
      fetchListing(listingId);
    }
  }, [listingId]);

  useEffect(() => {
    if (!listingId && currentStep === 1 && !data.id) {
      createDraft();
    }
  }, []);

  const fetchListing = async (id: string) => {
    try {
      const response = await fetch(`/api/listings/${id}`);
      if (response.ok) {
        const listing = await response.json();
        setData({ ...initialData, ...listing });
      }
    } catch (error) {
      console.error('Failed to load listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        setData(prev => ({ ...prev, id: listing.id }));
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
      setIsSaving(true);
      await fetch(`/api/listings/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data.id]);

  const updateData = useCallback((newData: Partial<ListingData>) => {
    setData(prev => {
      const updated = { ...prev, ...newData };
      saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    router.push(`?step=${step}`, { scroll: false });
  }, [router]);

  const handleNext = useCallback(() => {
    if (currentStep < 7) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const handlePublish = useCallback(async () => {
    if (!data.id) return;
    try {
      const response = await fetch(`/api/listings/${data.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portals: ['openimmo'] }),
      });
      if (response.ok) {
        router.push(`/dashboard/listings/${data.id}`);
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  }, [data.id, router]);

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PropertyType
            data={{ transaction_type: data.transaction_type, property_type: data.property_type }}
            onChange={(d) => updateData(d)}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Step2Location
            data={{
              street: data.street,
              house_number: data.house_number,
              postal_code: data.postal_code,
              city: data.city,
              district: data.district,
              country: data.country,
            }}
            onChange={(d) => updateData(d)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3Details
            data={{
              price: data.price,
              living_area: data.living_area,
              plot_area: data.plot_area,
              rooms: data.rooms,
              bedrooms: data.bedrooms,
              bathrooms: data.bathrooms,
              floor: data.floor,
              total_floors: data.total_floors,
              construction_year: data.construction_year,
              energy_rating: data.energy_rating,
              heating_type: data.heating_type || '',
            }}
            transactionType={data.transaction_type}
            onChange={(d) => updateData(d)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step4Features
            data={data.features}
            onChange={(d) => updateData({ features: { ...data.features, ...d } })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <Step5Description
            data={{ title: data.title, description: data.description }}
            propertyType={data.property_type}
            transactionType={data.transaction_type}
            city={data.city}
            onChange={(d) => updateData(d)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <Step6Media
            data={{ media_ids: data.media_ids, cover_image_id: data.cover_image_id }}
            onChange={(d) => updateData(d)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 7:
        return (
          <Step7Publish
            data={{
              transaction_type: data.transaction_type,
              property_type: data.property_type,
              title: data.title,
              city: data.city,
              price: data.price,
              media_ids: data.media_ids,
            }}
            onPublish={handlePublish}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {listingId ? 'Edit Listing' : 'Create New Listing'}
          </h1>
          <p className="text-gray-600">
            Step {currentStep} of 7: {STEPS[currentStep - 1]}
          </p>
        </div>

        <WizardProgressBar currentStep={currentStep} totalSteps={7} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          {renderStep()}
        </div>

        {isSaving && (
          <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </div>
        )}
      </main>
    </div>
  );
}
