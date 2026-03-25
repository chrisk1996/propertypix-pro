'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface Step2LocationProps {
  data: {
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    district: string;
    country: string;
  };
  onChange: (data: Partial<Step2LocationProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  terms: { value: string }[];
}

export function Step2Location({ data, onChange, onNext, onBack, isSaving }: Step2LocationProps) {
  const [localData, setLocalData] = useState(data);
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      // Using a simple geocoding approach - in production, use Google Places Autocomplete API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5&addressdetails=1&countrycodes=de`
      );
      const results = await response.json();
      
      const predictions: PlacePrediction[] = results.map((r: { place_id: number | string; display_name: string; address: Record<string, string> }) => ({
        place_id: String(r.place_id),
        description: r.display_name,
        structured_formatting: {
          main_text: r.address?.road || r.address?.city || input,
          secondary_text: [r.address?.postcode, r.address?.city, r.address?.country]
            .filter(Boolean)
            .join(', '),
        },
        terms: Object.values(r.address || {}).map(v => ({ value: v })),
      }));

      setSuggestions(predictions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const handleInputChange = (field: keyof typeof localData, value: string) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onChange({ [field]: value });

    // Trigger autocomplete for street+number combined field
    if (field === 'street' && value.length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(`${value}${localData.house_number ? ' ' + localData.house_number : ''}, ${localData.city || 'Deutschland'}`);
        setShowSuggestions(true);
      }, 300);
    }
  };

  const handleSuggestionSelect = (suggestion: PlacePrediction) => {
    // Parse the suggestion to fill in the form fields
    const parts = suggestion.terms.map(t => t.value);
    
    // Simple parsing - extract city and postal code from suggestion
    const cityMatch = suggestion.description.match(/(\d{5})\s+([^,]+)/);
    
    setLocalData(prev => ({
      ...prev,
      city: cityMatch ? cityMatch[2].split(' ')[0] : prev.city,
      postal_code: cityMatch ? cityMatch[1] : prev.postal_code,
    }));

    onChange({
      city: cityMatch ? cityMatch[2].split(' ')[0] : localData.city,
      postal_code: cityMatch ? cityMatch[1] : localData.postal_code,
    });

    setShowSuggestions(false);
    setSuggestions([]);
  };

  const canProceed = localData.city.trim().length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Wo liegt die Immobilie?</h2>
        <p className="text-gray-600">Geben Sie die Adresse der Immobilie ein.</p>
      </div>

      <div className="space-y-6">
        {/* Street and House Number */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Straße
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={localData.street}
                onChange={e => handleInputChange('street', e.target.value)}
                onFocus={() => localData.street.length >= 3 && setSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="z.B. Hauptstraße"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {isLoadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {suggestion.structured_formatting.main_text}
                        </div>
                        <div className="text-sm text-gray-500">
                          {suggestion.structured_formatting.secondary_text}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hausnummer
            </label>
            <input
              type="text"
              value={localData.house_number}
              onChange={e => handleInputChange('house_number', e.target.value)}
              placeholder="z.B. 42"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Postal Code and City */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postleitzahl
            </label>
            <input
              type="text"
              value={localData.postal_code}
              onChange={e => handleInputChange('postal_code', e.target.value)}
              placeholder="z.B. 10115"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stadt <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localData.city}
              onChange={e => handleInputChange('city', e.target.value)}
              placeholder="z.B. Berlin"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stadtteil / Bezirk
          </label>
          <input
            type="text"
            value={localData.district}
            onChange={e => handleInputChange('district', e.target.value)}
            placeholder="z.B. Mitte"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Land
          </label>
          <select
            value={localData.country}
            onChange={e => handleInputChange('country', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Deutschland">Deutschland</option>
            <option value="Österreich">Österreich</option>
            <option value="Schweiz">Schweiz</option>
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
