'use client';

import { useState } from 'react';

export type AIModel = | 'auto' | 'flux-kontext' | 'flux-depth' | 'sdxl' | 'ideogram' | 'llava' | 'llama-vision' | 'stable-video' | 'decor8';

interface AIModelOption {
  id: AIModel;
  name: string;
  description: string;
  cost: string;
  quality: string;
  speed: string;
  bestFor: string;
}

export const AI_MODELS: Record<string, AIModelOption[]> = {
  enhance: [
    { id: 'auto', name: 'Auto (Best)', description: 'Automatically selects best model', cost: '$0.01', quality: '⭐⭐⭐⭐', speed: '⚡⚡⚡', bestFor: 'General use' },
    { id: 'flux-kontext', name: 'FLUX Kontext Pro', description: 'Best for instruction-based edits', cost: '$0.02', quality: '⭐⭐⭐⭐⭐', speed: '⚡⚡', bestFor: 'Precise edits' },
    { id: 'sdxl', name: 'SDXL', description: 'Fast and versatile', cost: '$0.005', quality: '⭐⭐⭐', speed: '⚡⚡⚡⚡', bestFor: 'Quick edits' },
    { id: 'ideogram', name: 'Ideogram v2', description: 'Best for text in images', cost: '$0.02', quality: '⭐⭐⭐⭐', speed: '⚡⚡', bestFor: 'Text/logos' },
  ],
  staging: [
    { id: 'flux-depth', name: 'FLUX Depth Pro', description: 'Good depth preservation', cost: '$0.02', quality: '⭐⭐⭐⭐', speed: '⚡⚡⚡', bestFor: 'Virtual staging' },
    { id: 'flux-kontext', name: 'FLUX Kontext Pro', description: 'Instruction-based editing', cost: '$0.02', quality: '⭐⭐⭐⭐', speed: '⚡⚡', bestFor: 'Creative staging' },
  ],
  floorplan: [
    { id: 'llama-vision', name: 'Llama 3.2 Vision 90B', description: 'Best accuracy for floor plans', cost: '$0.01', quality: '⭐⭐⭐⭐⭐', speed: '⚡⚡', bestFor: 'Complex layouts' },
    { id: 'llava', name: 'LLaVA 13B', description: 'Fast and reliable', cost: '$0.005', quality: '⭐⭐⭐⭐', speed: '⚡⚡⚡⚡', bestFor: 'Simple layouts' },
  ],
  video: [
    { id: 'stable-video', name: 'Stable Video Diffusion', description: 'Standard video generation', cost: '$0.03', quality: '⭐⭐⭐', speed: '⚡⚡', bestFor: 'Quick videos' },
  ],
};

interface AIModelSelectorProps {
  category: 'enhance' | 'staging' | 'floorplan' | 'video';
  selected: AIModel;
  onSelect: (model: AIModel) => void;
}

export default function AIModelSelector({ category, selected, onSelect }: AIModelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const models = AI_MODELS[category] || [];
  const selectedModel = models.find(m => m.id === selected) || models[0];
  const otherModels = models.filter(m => m.id !== 'auto');

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">psychology</span>
        AI Model
      </label>
      
      {/* Selected Model Button (Auto by default) */}
      <button
        onClick={() => {
          if (selected === 'auto' && otherModels.length > 0) {
            setIsExpanded(!isExpanded);
          } else {
            onSelect('auto' as AIModel);
            setIsExpanded(false);
          }
        }}
        className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between ${
          selected === 'auto' || !isExpanded
            ? 'bg-blue-600 text-white'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{selectedModel.name}</span>
            <span className="text-xs opacity-75">{selectedModel.cost}</span>
          </div>
          <p className="text-xs opacity-75 mt-0.5">{selectedModel.description}</p>
        </div>
        {otherModels.length > 0 && (
          <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        )}
      </button>

      {/* Expanded Options */}
      {isExpanded && otherModels.length > 0 && (
        <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
          {otherModels.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsExpanded(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg transition-all ${
                selected === model.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{model.name}</span>
                <span className="text-xs opacity-75">{model.cost}</span>
              </div>
              <p className="text-xs opacity-75 mt-0.5">{model.description}</p>
              <div className="flex items-center gap-3 mt-1 text-xs opacity-60">
                <span>{model.quality}</span>
                <span>{model.speed}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
