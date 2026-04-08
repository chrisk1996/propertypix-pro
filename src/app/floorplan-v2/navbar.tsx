'use client';

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { SettingsPanel } from '@pascal-app/editor';

export function FloorplanNavbar() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Top navbar */}
      <div className="flex h-12 items-center justify-between border-b border-border bg-sidebar px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <span className="font-semibold">PropertyPix Floor Planner</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings panel overlay */}
      {showSettings && (
        <div className="absolute right-0 top-12 z-50 h-[calc(100%-48px)] w-80 border-l border-border bg-sidebar shadow-xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-medium text-sm">Settings</span>
            <button
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
              onClick={() => setShowSettings(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[calc(100%-48px)] overflow-y-auto">
            <SettingsPanel />
          </div>
        </div>
      )}
    </>
  );
}
