'use client';

import { useState } from 'react';
import AIModelSelector, { type AIModel } from '@/components/AIModelSelector';

type StagingRoom = 'living' | 'bedroom' | 'kitchen' | 'dining' | 'bathroom' | 'office' | 'basement' | 'patio';
type FurnitureStyle = 'modern' | 'scandinavian' | 'luxury' | 'minimalist' | 'industrial';

const stagingRooms = [
  { id: 'living' as const, icon: 'weekend', label: 'Living Room' },
  { id: 'bedroom' as const, icon: 'bed', label: 'Bedroom' },
  { id: 'kitchen' as const, icon: 'kitchen', label: 'Kitchen' },
  { id: 'dining' as const, icon: 'table_restaurant', label: 'Dining' },
  { id: 'bathroom' as const, icon: 'bathtub', label: 'Bathroom' },
  { id: 'office' as const, icon: 'desk', label: 'Home Office' },
  { id: 'basement' as const, icon: 'foundation', label: 'Basement' },
  { id: 'patio' as const, icon: 'deck', label: 'Patio' },
];;

const furnitureStyles = [
  { id: 'modern' as const, icon: 'weekend', label: 'Modern' },
  { id: 'scandinavian' as const, icon: 'chair', label: 'Scandinavian' },
  { id: 'luxury' as const, icon: 'diamond', label: 'Luxury' },
  { id: 'minimalist' as const, icon: 'minimize', label: 'Minimalist' },
  { id: 'industrial' as const, icon: 'factory', label: 'Industrial' },
  { id: 'bohemian' as const, icon: 'local_florist', label: 'Bohemian' },
  { id: 'midcentury' as const, icon: 'hourglass_top', label: 'Mid-Century' },
  { id: 'farmhouse' as const, icon: 'cottage', label: 'Farmhouse' },
];;

interface StagingPanelProps {
  /** Image URL or base64 data URL to stage */
  image: string | null;
  /** Called when staging completes successfully */
  onResult: (resultUrl: string, metadata: { roomType: string; furnitureStyle: string; model: string; creditsUsed: number }) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Optional: initial model selection */
  defaultModel?: AIModel;
  /** Optional: initial room selection */
  defaultRoom?: StagingRoom;
  /** Optional: initial style selection */
  defaultStyle?: FurnitureStyle;
  /** Optional: compact mode for sidebar/embedded use */
  compact?: boolean;
  /** Optional: additional class names */
  className?: string;
}

export function StagingPanel({
  image,
  onResult,
  onError,
  defaultModel = 'interior-design',
  defaultRoom = 'living',
  defaultStyle = 'modern',
  compact = false,
  className = '',
}: StagingPanelProps) {
  const [selectedRoom, setSelectedRoom] = useState<StagingRoom>(defaultRoom);
  const [selectedStyle, setSelectedStyle] = useState<FurnitureStyle>(defaultStyle);
  const [selectedModel, setSelectedModel] = useState<AIModel>(defaultModel);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStaging = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          roomType: selectedRoom,
          furnitureStyle: selectedStyle,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Staging failed');
      }

      onResult(data.output, {
        roomType: selectedRoom,
        furnitureStyle: selectedStyle,
        model: data.model || selectedModel,
        creditsUsed: data.creditsUsed || 2,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stage room';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <div className={className}>
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {/* Room Type Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Room Type</label>
          <div className="grid grid-cols-3 gap-2">
            {stagingRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                disabled={!image || isProcessing}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  selectedRoom === room.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="material-symbols-outlined text-lg">{room.icon}</span>
                <span className="text-xs font-semibold">{compact ? room.label.split(' ')[0] : room.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Furniture Style Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Furniture Style</label>
          <div className="flex flex-wrap gap-2">
            {furnitureStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                disabled={!image || isProcessing}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedStyle === style.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stage Button */}
        <button
          onClick={handleStaging}
          disabled={!image || isProcessing}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            image && !isProcessing
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Staging...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
                <path d="M4 18v2" />
                <path d="M20 18v2" />
              </svg>
              Stage Room (2-3 credits)
            </span>
          )}
        </button>

        {/* AI Model Selector */}
        <div className="p-3 bg-slate-50 rounded-xl">
          <AIModelSelector category="staging" selected={selectedModel} onSelect={setSelectedModel} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
            {error}
            <button onClick={clearError} className="font-bold text-lg">×</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Export types for consumers
export type { StagingRoom, FurnitureStyle };
