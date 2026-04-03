'use client';
import { useState } from 'react';

export type Tool = 'select' | 'wall' | 'room' | 'door' | 'window' | 'furniture' | 'pan';

interface ToolConfig {
  id: Tool;
  icon: string;
  label: string;
  shortcut: string;
  description: string;
}

const TOOLS: ToolConfig[] = [
  { id: 'select', icon: 'touch_app', label: 'Select', shortcut: 'V', description: 'Select and edit elements' },
  { id: 'wall', icon: 'timeline', label: 'Wall', shortcut: 'W', description: 'Draw walls by clicking points' },
  { id: 'room', icon: 'crop_square', label: 'Room', shortcut: 'R', description: 'Draw room boundaries' },
  { id: 'door', icon: 'door_front', label: 'Door', shortcut: 'D', description: 'Add doors to walls' },
  { id: 'window', icon: 'window', label: 'Window', shortcut: 'Shift+D', description: 'Add windows to walls' },
  { id: 'furniture', icon: 'chair', label: 'Furniture', shortcut: 'F', description: 'Place furniture items' },
  { id: 'pan', icon: 'pan_tool', label: 'Pan', shortcut: 'H', description: 'Pan the canvas' },
];

interface ToolPaletteProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

export default function ToolPalette({ activeTool, onToolChange }: ToolPaletteProps) {
  // Handle keyboard shortcuts
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toUpperCase();
      const tool = TOOLS.find(t => t.shortcut === key);
      if (tool && tool.id !== activeTool) {
        onToolChange(tool.id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="bg-white border-r border-slate-200 p-2 flex flex-col gap-1">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            activeTool === tool.id
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
          title={`${tool.label} (${tool.shortcut})\n${tool.description}`}
        >
          <span className="material-symbols-outlined">{tool.icon}</span>
        </button>
      ))}
      
      <div className="h-px bg-slate-200 my-2" />
      
      {/* Zoom controls */}
      <button
        onClick={() => {/* zoom in */}}
        className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100"
        title="Zoom In"
      >
        <span className="material-symbols-outlined">zoom_in</span>
      </button>
      <button
        onClick={() => {/* zoom out */}}
        className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100"
        title="Zoom Out"
      >
        <span className="material-symbols-outlined">zoom_out</span>
      </button>
    </div>
  );
}
