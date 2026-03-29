'use client';
import { useState } from 'react';

const SHORTCUTS = [
  { key: 'V', action: 'Select tool', icon: 'arrow-pointer' },
  { key: 'W', action: 'Wall tool', icon: 'timeline' },
  { key: 'R', action: 'Room tool', icon: 'crop_square' },
  { key: 'D', action: 'Door tool', icon: 'door_front' },
  { key: 'F', action: 'Furniture tool', icon: 'chair' },
  { key: 'H', action: 'Pan tool', icon: 'pan_tool' },
  { key: 'Delete', action: 'Delete selected', icon: 'delete' },
  { key: 'Ctrl+Z', action: 'Undo', icon: 'undo' },
  { key: 'Ctrl+Y', action: 'Redo', icon: 'redo' },
  { key: 'Ctrl+S', action: 'Save project', icon: 'save' },
  { key: 'Ctrl+E', action: 'Export', icon: 'download' },
  { key: '+/-', action: 'Zoom in/out', icon: 'zoom_in' },
];

interface KeyboardShortcutsHelpProps {
  onClose?: () => void;
}

export default function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-700 transition-colors z-40"
        title="Keyboard shortcuts"
      >
        <span className="material-symbols-outlined">keyboard</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-900">Keyboard Shortcuts</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-3">
              {SHORTCUTS.map(({ key, action, icon }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="material-symbols-outlined text-slate-500">{icon}</span>
                  <span className="text-sm text-slate-600 flex-1">{action}</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-700 shadow-sm">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono">?</kbd> anytime to see this help
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
