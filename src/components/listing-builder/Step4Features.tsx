'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { ListingFeatures, FEATURE_LABELS } from '@/types/listing';

interface Step4FeaturesProps {
  data: ListingFeatures;
  onChange: (data: Partial<ListingFeatures>) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving?: boolean;
}

const BOOLEAN_FEATURES: (keyof ListingFeatures)[] = [
  'has_balcony',
  'has_terrace',
  'has_garden',
  'has_basement',
  'has_elevator',
  'has_parking',
  'pets_allowed',
  'built_in_kitchen',
  'has_aircon',
  'has_fireplace',
  'has_pool',
  'is_furnished',
  'has_storage',
  'has_laundry',
  'wheelchair_accessible',
  'has_alarm',
  'has_video_intercom',
];

const PARKING_TYPES = [
  { value: 'garage', label: 'Garage' },
  { value: 'carport', label: 'Carport' },
  { value: 'outdoor', label: 'Außenstellplatz' },
  { value: 'underground', label: 'Tiefgarage' },
];

export function Step4Features({ data, onChange, onNext, onBack, isSaving }: Step4FeaturesProps) {
  const [localData, setLocalData] = useState<ListingFeatures>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleToggleFeature = (feature: keyof ListingFeatures) => {
    const newValue = !localData[feature];
    const newData = { ...localData, [feature]: newValue };
    setLocalData(newData);
    onChange({ [feature]: newValue });
  };

  const handleParkingTypeChange = (type: 'garage' | 'carport' | 'outdoor' | 'underground') => {
    const newData = { ...localData, parking_type: type };
    setLocalData(newData);
    onChange({ parking_type: type });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ausstattung</h2>
        <p className="text-gray-600">Wählen Sie die Merkmale der Immobilie aus.</p>
      </div>

      <div className="space-y-6">
        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {BOOLEAN_FEATURES.map(feature => {
            const isActive = !!localData[feature];
            const label = FEATURE_LABELS[feature];
            const isParkingType = feature === 'parking_type';

            // Skip parking_type in the grid - it's a separate dropdown
            if (isParkingType) return null;

            return (
              <button
                key={feature}
                type="button"
                onClick={() => handleToggleFeature(feature)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all duration-200
                  ${isActive
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isActive ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {label}
                  </span>
                  <div className={`
                    w-5 h-5 rounded flex items-center justify-center
                    ${isActive ? 'bg-indigo-600' : 'bg-gray-200'}
                  `}>
                    {isActive && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Parking Type (conditional) */}
        {localData.has_parking && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Parkplatz-Art
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PARKING_TYPES.map(type => {
                const isSelected = localData.parking_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleParkingTypeChange(type.value as 'garage' | 'carport' | 'outdoor' | 'underground')}
                    className={`
                      px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                      ${isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={isSaving}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium
            transition-all duration-200
            ${!isSaving
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              Weiter
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
