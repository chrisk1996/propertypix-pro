'use client';

import { cn } from '@/utils/cn';

type Mode = 'url' | 'manual';

interface VideoModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
}

export function VideoModeToggle({ mode, onChange, disabled }: VideoModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
      <button
        type="button"
        onClick={() => onChange('url')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all',
          mode === 'url'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <span className="material-symbols-outlined text-lg">link</span>
        Listing URL
      </button>
      <button
        type="button"
        onClick={() => onChange('manual')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all',
          mode === 'manual'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <span className="material-symbols-outlined text-lg">upload</span>
        Manual Upload
      </button>
    </div>
  );
}
