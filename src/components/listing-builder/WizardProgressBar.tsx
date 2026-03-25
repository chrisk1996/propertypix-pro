'use client';

import { Check } from 'lucide-react';

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = [
  'Objektart',
  'Lage',
  'Details',
  'Ausstattung',
  'Beschreibung',
  'Medien',
  'Veröffentlichen',
];

export function WizardProgressBar({ currentStep, totalSteps = 7 }: WizardProgressBarProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full mb-8">
      {/* Progress line */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
        
        {/* Step indicators */}
        <div className="relative flex justify-between">
          {STEP_LABELS.map((label, index) => {
            const step = index + 1;
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            const isClickable = step < currentStep;

            return (
              <div
                key={step}
                className="flex flex-col items-center"
              >
                <button
                  disabled={!isClickable}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-200
                    ${isCompleted
                      ? 'bg-indigo-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : 'bg-gray-200 text-gray-500'
                    }
                    ${isClickable ? 'cursor-pointer hover:bg-indigo-700' : 'cursor-default'}
                  `}
                  aria-label={`Schritt ${step}: ${label}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </button>
                <span
                  className={`
                    mt-2 text-xs font-medium text-center max-w-[80px]
                    ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                  `}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
