'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ENERGY_RATINGS, HEATING_TYPES } from '@/types/listing';

interface Step3DetailsProps {
  data: {
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
  };
  transactionType: 'sale' | 'rent';
  onChange: (data: Partial<Step3DetailsProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving?: boolean;
}

export function Step3Details({ data, transactionType, onChange, onNext, onBack, isSaving }: Step3DetailsProps) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleInputChange = (field: keyof typeof localData, value: string | number) => {
    const parsedValue = typeof value === 'string' && field !== 'energy_rating' && field !== 'heating_type'
      ? parseFloat(value) || 0
      : value;
    
    const newData = { ...localData, [field]: parsedValue };
    setLocalData(newData);
    onChange({ [field]: parsedValue });
  };

  const canProceed = localData.price > 0 && localData.living_area > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Objektdetails</h2>
        <p className="text-gray-600">Geben Sie die wichtigsten Daten zur Immobilie ein.</p>
      </div>

      <div className="space-y-6">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preis {transactionType === 'sale' ? '(Kaufpreis)' : '(Kaltmiete)'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={localData.price || ''}
              onChange={e => handleInputChange('price', e.target.value)}
              placeholder={transactionType === 'sale' ? 'z.B. 450000' : 'z.B. 1200'}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
          </div>
          {transactionType === 'rent' && (
            <p className="mt-1 text-sm text-gray-500">
              Monatliche Kaltmiete (ohne Nebenkosten)
            </p>
          )}
        </div>

        {/* Areas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wohnfläche <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={localData.living_area || ''}
                onChange={e => handleInputChange('living_area', e.target.value)}
                placeholder="z.B. 85"
                className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">m²</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grundstück
            </label>
            <div className="relative">
              <input
                type="number"
                value={localData.plot_area || ''}
                onChange={e => handleInputChange('plot_area', e.target.value)}
                placeholder="z.B. 450"
                className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">m²</span>
            </div>
          </div>
        </div>

        {/* Rooms */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zimmer
            </label>
            <input
              type="number"
              step="0.5"
              value={localData.rooms || ''}
              onChange={e => handleInputChange('rooms', e.target.value)}
              placeholder="z.B. 3.5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schlafzimmer
            </label>
            <input
              type="number"
              value={localData.bedrooms || ''}
              onChange={e => handleInputChange('bedrooms', e.target.value)}
              placeholder="z.B. 2"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Badezimmer
            </label>
            <input
              type="number"
              value={localData.bathrooms || ''}
              onChange={e => handleInputChange('bathrooms', e.target.value)}
              placeholder="z.B. 1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Floors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etage
            </label>
            <input
              type="number"
              value={localData.floor || ''}
              onChange={e => handleInputChange('floor', e.target.value)}
              placeholder="z.B. 2"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">0 = Erdgeschoss, -1 = Untergeschoss</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etagen gesamt
            </label>
            <input
              type="number"
              value={localData.total_floors || ''}
              onChange={e => handleInputChange('total_floors', e.target.value)}
              placeholder="z.B. 5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Year and Energy */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Baujahr
            </label>
            <input
              type="number"
              value={localData.construction_year || ''}
              onChange={e => handleInputChange('construction_year', e.target.value)}
              placeholder="z.B. 1995"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Energieausweis
            </label>
            <select
              value={localData.energy_rating}
              onChange={e => handleInputChange('energy_rating', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Bitte wählen --</option>
              {ENERGY_RATINGS.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Heating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heizungsart
          </label>
          <select
            value={localData.heating_type}
            onChange={e => handleInputChange('heating_type', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Bitte wählen --</option>
            {HEATING_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
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
          disabled={!canProceed || isSaving}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium
            transition-all duration-200
            ${canProceed && !isSaving
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
