'use client';

import { useState, useEffect } from 'react';
import { Home, Building, Store, Trees, Car, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { TransactionType, PropertyType, PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from '@/types/listing';

interface Step1PropertyTypeProps {
  data: {
    transaction_type: TransactionType | '';
    property_type: PropertyType | '';
  };
  onChange: (data: Partial<{ transaction_type: TransactionType; property_type: PropertyType }>) => void;
  onNext: () => void;
  onBack?: () => void;
  isSaving?: boolean;
}

const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ElementType> = {
  apartment: Building,
  house: Home,
  commercial: Store,
  land: Trees,
  garage: Car,
  other: HelpCircle,
};

const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'commercial', 'land', 'garage', 'other'];

export function Step1PropertyType({ data, onChange, onNext, isSaving }: Step1PropertyTypeProps) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleTransactionChange = (type: TransactionType) => {
    setLocalData(prev => ({ ...prev, transaction_type: type }));
    onChange({ transaction_type: type });
  };

  const handlePropertyTypeChange = (type: PropertyType) => {
    setLocalData(prev => ({ ...prev, property_type: type }));
    onChange({ property_type: type });
  };

  const canProceed = localData.transaction_type && localData.property_type;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Was möchten Sie anbieten?</h2>
        <p className="text-gray-600">Wählen Sie die Art des Immobilienangebots.</p>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Transaktionsart
        </label>
        <div className="grid grid-cols-2 gap-4">
          {(['sale', 'rent'] as TransactionType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleTransactionChange(type)}
              className={`
                p-6 rounded-xl border-2 text-left transition-all duration-200
                ${localData.transaction_type === type
                  ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${localData.transaction_type === type
                    ? 'border-indigo-600'
                    : 'border-gray-300'
                  }
                `}>
                  {localData.transaction_type === type && (
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <span className="font-medium text-gray-900">
                  {TRANSACTION_TYPE_LABELS[type]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Immobilienart
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PROPERTY_TYPES.map(type => {
            const Icon = PROPERTY_TYPE_ICONS[type];
            const isSelected = localData.property_type === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => handlePropertyTypeChange(type)}
                className={`
                  p-6 rounded-xl border-2 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`
                  w-8 h-8 mx-auto mb-2
                  ${isSelected ? 'text-indigo-600' : 'text-gray-400'}
                `} />
                <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {PROPERTY_TYPE_LABELS[type]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
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
