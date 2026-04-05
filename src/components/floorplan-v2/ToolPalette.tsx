'use client';

import { useFloorPlanStore } from '@/store/floorplan/store';

const TOOLS: { id: string; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: 'mouse', label: 'Select', shortcut: 'V' },
  { id: 'wall', icon: 'square', label: 'Wall', shortcut: 'W' },
  { id: 'room', icon: 'crop_square', label: 'Room', shortcut: 'R' },
  { id: 'door', icon: 'meeting_door', label: 'Door', shortcut: 'D' },
  { id: 'window', icon: 'window', label: 'Window', shortcut: 'N' },
  { id: 'furniture', icon: 'chair', label: 'Furniture', shortcut: 'F' },
  { id: 'pan', icon: 'pan_tool', label: 'Pan', shortcut: 'H' },
];

export function ToolPalette() {
  const { activeTool, setTool, zoomIn, zoomOut } = useFloorPlanStore();

  return (
    <div className="space-y-2">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setTool(tool.id as any)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
            activeTool === tool.id
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title={`${tool.label} (${tool.shortcut})`}
        >
          <span className="material-symbols-outlined text-lg">{tool.icon}</span>
          <span>{tool.label}</span>
          <span className="ml-auto text-xs opacity-60">{tool.shortcut}</span>
        </button>
      ))}
      <div className="h-px bg-slate-700" />
      <button
        onClick={zoomIn}
        className="flex w-full items-center gap-3 rounded-lg bg-slate-800 px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-700"
        title="Zoom In"
      >
        <span className="material-symbols-outlined text-lg">zoom_in</span>
        <span>Zoom In</span>
      </button>
      <button
        onClick={zoomOut}
        className="flex w-full items-center gap-3 rounded-lg bg-slate-800 px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-700"
        title="Zoom Out"
      >
        <span className="material-symbols-outlined text-lg">zoom_out</span>
        <span>Zoom Out</span>
      </button>
    </div>
  );
}
