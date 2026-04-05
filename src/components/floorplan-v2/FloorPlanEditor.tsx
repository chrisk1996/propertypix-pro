'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFloorPlanStore, useFloorPlanUndo } from '@/store/floorplan/store';
import { FloorPlanCanvas2D } from './FloorPlanCanvas2D';
import { PropertiesPanel } from './PropertiesPanel';
import { ToolPalette } from './ToolPalette';
import { FurnitureLibraryCompact } from './FurnitureLibraryCompact';
import { FloorPlanScene3D } from './FloorPlanScene3D';
import { useState, useCallback, useEffect, useRef } from 'react';

// Pascal-style sidebar store for layout state
import { create } from 'zustand';

interface SidebarState {
  width: number;
  isCollapsed: boolean;
  isDragging: boolean;
  setWidth: (width: number) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsDragging: (dragging: boolean) => void;
}

const useSidebarStore = create<SidebarState>((set) => ({
  width: 320,
  isCollapsed: false,
  isDragging: false,
  setWidth: (width) => set({ width }),
  setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
  setIsDragging: (isDragging) => set({ isDragging }),
}));

const SIDEBAR_MIN_WIDTH = 280;
const SIDEBAR_MAX_WIDTH = 600;
const SIDEBAR_COLLAPSE_THRESHOLD = 200;

// Left sidebar with resizable panel
function LeftSidebar({ children }: { children: React.ReactNode }) {
  const width = useSidebarStore((s) => s.width);
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const setIsCollapsed = useSidebarStore((s) => s.setIsCollapsed);
  const setWidth = useSidebarStore((s) => s.setWidth);
  const isDragging = useSidebarStore((s) => s.isDragging);
  const setIsDragging = useSidebarStore((s) => s.setIsDragging);
  const isResizing = useRef(false);
  const isExpanding = useRef(false);

  const handleResizerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isResizing.current = true;
      setIsDragging(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [setIsDragging]
  );

  const handleGrabDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isExpanding.current = true;
      setIsDragging(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [setIsDragging]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isResizing.current) {
        const newWidth = e.clientX;
        if (newWidth < SIDEBAR_COLLAPSE_THRESHOLD) {
          setIsCollapsed(true);
        } else {
          setIsCollapsed(false);
          setWidth(Math.max(SIDEBAR_MIN_WIDTH, Math.min(newWidth, SIDEBAR_MAX_WIDTH)));
        }
      } else if (isExpanding.current && e.clientX > 60) {
        setIsCollapsed(false);
        setWidth(Math.max(SIDEBAR_MIN_WIDTH, Math.min(e.clientX, SIDEBAR_MAX_WIDTH)));
      }
    };

    const handlePointerUp = () => {
      isResizing.current = false;
      isExpanding.current = false;
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [setWidth, setIsCollapsed, setIsDragging]);

  if (isCollapsed) {
    return (
      <div
        className="relative h-full w-2 flex-shrink-0 cursor-col-resize transition-colors hover:bg-blue-500/20"
        onPointerDown={handleGrabDown}
        title="Expand sidebar"
      />
    );
  }

  return (
    <div
      className="relative z-10 flex h-full flex-shrink-0 flex-col bg-slate-900 text-white"
      style={{
        width,
        transition: isDragging ? 'none' : 'width 150ms ease',
      }}
    >
      {children}
      {/* Resize handle */}
      <div
        className="absolute inset-y-0 -right-3 z-[100] flex w-6 cursor-col-resize items-center justify-center"
        onPointerDown={handleResizerDown}
      >
        <div className="h-8 w-1 rounded-full bg-slate-500" />
      </div>
    </div>
  );
}

// Tab bar for sidebar panels
function SidebarTabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string; icon: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <div className="flex border-b border-slate-700 bg-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-blue-500 bg-slate-900 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function FloorPlanEditor() {
  const { viewMode, setViewMode } = useFloorPlanStore();
  const { undo, redo, canUndo, canRedo } = useFloorPlanUndo();
  const [activeSidebarTab, setActiveSidebarTab] = useState('tools');

  const sidebarTabs = [
    { id: 'tools', label: 'Tools', icon: 'construction' },
    { id: 'layers', label: 'Layers', icon: 'layers' },
    { id: 'catalog', label: 'Catalog', icon: 'category' },
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full">
      {/* Left Sidebar — Pascal style */}
      <LeftSidebar>
        <SidebarTabBar
          tabs={sidebarTabs}
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
        />
        <div className="flex-1 overflow-y-auto p-4">
          {activeSidebarTab === 'tools' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">Drawing Tools</h3>
              <ToolPalette />
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-300">View</h3>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      viewMode === '2d'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    2D
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      viewMode === '3d'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    3D
                  </button>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-300">History</h3>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => undo()}
                    disabled={!canUndo}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      canUndo
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    ↶ Undo
                  </button>
                  <button
                    onClick={() => redo()}
                    disabled={!canRedo}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      canRedo
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    ↷ Redo
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeSidebarTab === 'layers' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">Layers</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-2">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <span className="text-sm">Walls</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-2">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <span className="text-sm">Rooms</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-2">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <span className="text-sm">Furniture</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-2">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  <span className="text-sm">Doors & Windows</span>
                </div>
              </div>
            </div>
          )}
          {activeSidebarTab === 'catalog' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">Furniture Catalog</h3>
              <FurnitureLibraryCompact />
            </div>
          )}
        </div>
      </LeftSidebar>

      {/* Center: Canvas Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top toolbar */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('2d')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                viewMode === '2d'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              3D
            </button>
          </div>
          <div className="text-sm text-slate-500">
            Floor Planner v2 — Pascal Layout
          </div>
        </div>

        {/* Canvas */}
        <div className="relative flex-1 overflow-hidden">
          {viewMode === '2d' && <FloorPlanCanvas2D />}
          {viewMode === '3d' && (
            <Canvas shadows className="h-full w-full bg-slate-100">
              <PerspectiveCamera makeDefault position={[10, 10, 10]} />
              <OrbitControls />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <FloorPlanScene3D />
              <gridHelper args={[20, 20]} />
            </Canvas>
          )}
        </div>
      </div>

      {/* Right Sidebar: Properties Panel */}
      <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-white">
        <PropertiesPanel />
      </div>
    </div>
  );
}
