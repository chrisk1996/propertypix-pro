'use client';

import { useState, useEffect, useCallback } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  target?: string; // CSS selector for highlighting
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Floor Planner!',
    description: 'This tool lets you create 2D floor plans and visualize them in 3D. Let\'s take a quick tour.',
    icon: 'home',
  },
  {
    id: 'tools',
    title: 'Drawing Tools',
    description: 'Use the toolbar on the left to select tools: Select (V), Wall (W), Room (R), Door (D), and Pan (H). Each tool has a keyboard shortcut.',
    icon: 'construction',
    target: '[data-tutorial="tools"]',
  },
  {
    id: 'canvas',
    title: 'Canvas Area',
    description: 'Draw walls and rooms on the grid. Use mouse wheel to zoom, and drag with Pan tool or middle mouse button to pan around.',
    icon: 'grid_on',
  },
  {
    id: 'properties',
    title: 'Properties Panel',
    description: 'Select any element to view and edit its properties on the right panel. Change wall thickness, room types, and more.',
    icon: 'tune',
    target: '[data-tutorial="properties"]',
  },
  {
    id: 'furniture',
    title: 'Furniture Library',
    description: 'Browse furniture at the bottom panel. Click to select, then click on the canvas to place. Use R key to rotate selected furniture.',
    icon: 'chair',
    target: '[data-tutorial="furniture"]',
  },
  {
    id: 'views',
    title: '2D / 3D Views',
    description: 'Switch between 2D Editor, 3D View, and Split view using the tabs at the top. See your floor plan come to life in 3D!',
    icon: '3d_rotation',
    target: '[data-tutorial="views"]',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Press ? or click the keyboard icon at bottom right to see all shortcuts. Undo/Redo with Ctrl+Z / Ctrl+Y.',
    icon: 'keyboard',
    target: '[data-tutorial="shortcuts"]',
  },
  {
    id: 'export',
    title: 'Save & Export',
    description: 'Use Quick Actions to save your project or export as PNG, PDF, SVG, GLB, or GLTF. Your work is automatically saved in browser storage.',
    icon: 'download',
  },
];

interface FirstTimeUserTutorialProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const STORAGE_KEY = 'floorplanner-tutorial-completed';

export default function FirstTimeUserTutorial({ onComplete, forceShow = false }: FirstTimeUserTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true); // Default to true to prevent flash

  // Check if tutorial was already completed
  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      setHasCompleted(false);
      return;
    }

    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (completed !== 'true') {
        setHasCompleted(false);
        setIsOpen(true);
      }
    } catch (e) {
      // localStorage might not be available
      setHasCompleted(false);
    }
  }, [forceShow]);

  // Mark tutorial as completed
  const completeTutorial = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      // Ignore storage errors
    }
    setHasCompleted(true);
    setIsOpen(false);
    onComplete?.();
  }, [onComplete]);

  // Skip tutorial
  const skipTutorial = useCallback(() => {
    completeTutorial();
  }, [completeTutorial]);

  // Go to next step
  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentStep, completeTutorial]);

  // Go to previous step
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        skipTutorial();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextStep, prevStep, skipTutorial]);

  // Don't render if completed or not open
  if (hasCompleted && !forceShow) return null;
  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
        onClick={skipTutorial}
      />

      {/* Modal */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-slate-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-3xl text-blue-600">
                {step.icon}
              </span>
            </div>

            {/* Step counter */}
            <p className="text-center text-sm text-slate-400 mb-2">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </p>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-slate-900 mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-center text-slate-600 mb-6 leading-relaxed">
              {step.description}
            </p>

            {/* Navigation dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {TUTORIAL_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all
                    ${index === currentStep
                      ? 'bg-blue-600 w-6'
                      : index < currentStep
                        ? 'bg-blue-400'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm mr-1 align-middle">arrow_back</span>
                  Back
                </button>
              )}

              <button
                onClick={nextStep}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                  <>
                    Get Started
                    <span className="material-symbols-outlined text-sm ml-1 align-middle">rocket_launch</span>
                  </>
                ) : (
                  <>
                    Next
                    <span className="material-symbols-outlined text-sm ml-1 align-middle">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skip link */}
          <div className="px-6 pb-4">
            <button
              onClick={skipTutorial}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 py-2"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>

      {/* Re-open tutorial button (hidden, shown by parent) */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

// Hook to check and show tutorial
export function useTutorialState() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (completed !== 'true') {
        // Small delay to let UI render first
        setTimeout(() => setShowTutorial(true), 500);
      }
    } catch (e) {
      // Ignore - SSR safe
    }
  }, []);

  const reopenTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  return { showTutorial, setShowTutorial, reopenTutorial };
}
