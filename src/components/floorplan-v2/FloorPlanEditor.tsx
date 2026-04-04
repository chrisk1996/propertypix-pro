'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { useFloorPlanStore, useFloorPlanUndo, Tool, ViewMode } from '@/store/floorplan/store';
import { FloorPlanCanvas2D } from './FloorPlanCanvas2D';
import { PropertiesPanel } from './PropertiesPanel';
import { ToolPalette } from './ToolPalette';
import { FurnitureLibraryCompact } from './FurnitureLibraryCompact';
import { FloorPlanScene3D } from './FloorPlanScene3D';

export function FloorPlanEditor() {
  const { activeTool, viewMode, setTool, setViewMode, zoomIn, zoomOut } = useFloorPlanStore();
  const { undo, redo, canUndo, canRedo } = useFloorPlanUndo();

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Left: Tool Palette */}
      <ToolPalette
        activeTool={activeTool}
        onToolChange={setTool}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Center: Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-white">
          {/* View Mode Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === '2d' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-4 py-2 text-sm font-medium border-l border-slate-200 ${
                viewMode === '3d' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-4 py-2 text-sm font-medium border-l border-slate-200 ${
                viewMode === 'split' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Split
            </button>
          </div>

          <div className="flex-1" />

          {/* Info */}
          <span className="text-sm text-slate-500">
            {activeTool === 'select' && 'Click to select, drag to move'}
            {activeTool === 'wall' && 'Click and drag to draw walls'}
            {activeTool === 'room' && 'Click to place room corners, double-click to finish'}
            {activeTool === 'furniture' && 'Select furniture below, then click to place'}
          </span>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex min-h-0">
          {/* 2D Canvas */}
          {(viewMode === '2d' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} h-full`}>
              <FloorPlanCanvas2D />
            </div>
          )}

          {/* 3D Canvas */}
          {(viewMode === '3d' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} h-full bg-slate-100`}>
              <Canvas shadows>
                <PerspectiveCamera makeDefault position={[10, 10, 10]} />
                <OrbitControls />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <FloorPlanScene3D />
                <gridHelper args={[20, 20]} />
              </Canvas>
            </div>
          )}
        </div>

        {/* Bottom: Furniture Library */}
        <div className="h-32 border-t border-slate-200 bg-white p-2">
          <FurnitureLibraryCompact />
        </div>
      </div>

      {/* Right: Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
