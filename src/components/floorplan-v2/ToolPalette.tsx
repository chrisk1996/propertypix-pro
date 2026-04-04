'use client';

import { useFloorPlanStore } from '@/store/floorplan/store';
import type { Tool } from '@/store/floorplan/store';

interface ToolPaletteProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLS: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: 'mouse', label: 'Select', shortcut: 'V' },
  { id: 'wall', icon: 'square', label: 'Wall', shortcut: 'W' },
  { id: 'room', icon: 'crop_square', label: 'Room', shortcut: 'R' },
  { id: 'door', icon: 'meeting_door', label: 'Door', shortcut: 'D' },
  { id: 'window', icon: 'window', label: 'Window', shortcut: 'N' },
  { id: 'furniture', icon: 'chair', label: 'Furniture', shortcut: 'F' },
  { id: 'pan', icon: 'pan_tool', label: 'Pan', shortcut: 'H' },
];

export function ToolPalette({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolPaletteProps) {
  return (
    <div className="w-16 bg-white border-r border-slate-200 flex flex-col p-2 gap-2">
      {/* Tools */}
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            activeTool === tool.id
              ? 'bg-blue-600 text-white'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
          title={`${tool.label} (${tool.shortcut})`}
        >
          <span className="material-symbols-outlined">{tool.icon}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="h-px bg-slate-200 my-2" />

      {/* Zoom */}
      <button
        onClick={onZoomIn}
        className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100"
        title="Zoom In"
      >
        <span className="material-symbols-outlined">zoom_in</span>
      </button>
      <button
        onClick={onZoomOut}
        className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100"
        title="Zoom Out"
      >
        <span className="material-symbols-outlined">zoom_out</span>
      </button>

      {/* Divider */}
      <div className="h-px bg-slate-200 my-2" />

      {/* Undo/Redo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          canUndo ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-slate-100 text-slate-300'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <span className="material-symbols-outlined">undo</span>
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          canRedo ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-slate-100 text-slate-300'
        }`}
        title="Redo (Ctrl+Y)"
      >
        <span className="material-symbols-outlined">redo</span>
      </button>
    </div>
  );
}
