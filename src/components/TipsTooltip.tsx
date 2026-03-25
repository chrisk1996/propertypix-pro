'use client';

import { useState } from 'react';
import { HelpCircle, X, Lightbulb, Keyboard, Image as ImageIcon } from 'lucide-react';

interface TipItem {
  title: string;
  content: string;
}

const tips: TipItem[] = [
  {
    title: 'Drag to Compare',
    content: 'After enhancement, drag the slider left and right to compare before and after results.',
  },
  {
    title: 'Choose the Right Enhancement',
    content: 'Auto Enhance works great for most photos. Use Sky Replace for dull skies, and Virtual Staging for empty rooms.',
  },
  {
    title: 'Best Photo Quality',
    content: 'For best results, upload high-resolution photos (at least 1920x1080) with good lighting.',
  },
];

const shortcuts = [
  { key: 'Drag', action: 'Compare before/after' },
  { key: 'Esc', action: 'Reset to original' },
];

export function TipsTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 transition-colors"
        title="View tips"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm">Tips</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Pro Tips
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {tips.map((tip, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900 text-sm mb-1">{tip.title}</p>
                <p className="text-gray-600 text-sm">{tip.content}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3">
            <h5 className="font-medium text-gray-900 flex items-center gap-2 text-sm mb-2">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </h5>
            <div className="space-y-1">
              {shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{shortcut.action}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function KeyboardShortcutsHint() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">←</kbd>
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">→</kbd>
        <span className="ml-1">Drag to compare</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">Esc</kbd>
        <span className="ml-1">Reset</span>
      </span>
    </div>
  );
}
