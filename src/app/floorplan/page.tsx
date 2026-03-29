'use client';

import { useState, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import AIModelSelector, { type AIModel } from '@/components/AIModelSelector';
import FurnitureLibrary, { type FurnitureItem } from '@/components/FurnitureLibrary';
import type { PlacedFurniturePiece } from '@/components/PlacedFurniture';
import dynamic from 'next/dynamic';

// Dynamically import 3D viewer to avoid SSR issues
const FloorPlan3DViewer = dynamic(
  () => import('@/components/FloorPlan3DViewer'),
  { ssr: false }
);

interface Wall {
  start: [number, number];
  end: [number, number];
  type: 'exterior' | 'interior';
}

interface Door {
  position: [number, number];
  rotation: number;
  room: string;
}

interface Window {
  position: [number, number];
  width: number;
  wall: 'exterior';
}

interface Room {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

interface FloorPlanData {
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  totalArea: number;
  bedroomCount: number;
  bathroomCount: number;
  metadata?: {
    analyzedAt: string;
    fallback?: boolean;
    error?: string;
  };
}

const materialOptions = [
  { id: 'oak', name: 'Natural Oak', color: '#D4A574' },
  { id: 'grey', name: 'Polished Grey', color: '#9CA3AF' },
  { id: 'marble', name: 'Carrara Marble', color: '#F5F5F5' },
  { id: 'brick', name: 'Rustic Brick', color: '#B45C3B' },
  { id: 'white', name: 'Pure White', color: '#FFFFFF' },
];

export default function FloorPlanPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'top' | 'front' | 'side' | 'walkthrough'>('perspective');
  const [lightingMode, setLightingMode] = useState<'day' | 'night'>('day');
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniturePiece[]>([]);
  const [selectedFurnitureItem, setSelectedFurnitureItem] = useState<FurnitureItem | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'furniture' | 'lighting'>('furniture');
  const [selectedModel, setSelectedModel] = useState<AIModel>('llama-vision');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      processFile(file);
    } else {
      setError('Please upload an image or PDF file');
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      analyzeFloorPlan(e.target?.result as string, file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFloorPlan = async (imageData: string, fileType: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/floorplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData,
          fileType,
          model: 'llama32'
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setFloorPlanData(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze floor plan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFurniturePlace = (position: [number, number, number]) => {
    if (!selectedFurnitureItem) return;

    const newPiece: PlacedFurniturePiece = {
      id: `${selectedFurnitureItem.id}-${Date.now()}`,
      furniture: selectedFurnitureItem,
      position: [position[0], 0, position[2]],
      rotation: 0,
      scale: 1,
    };

    setPlacedFurniture(prev => [...prev, newPiece]);
    setSelectedFurnitureItem(null);
  };

  const handleFurnitureSelect = (pieceId: string | null) => {
    setSelectedPieceId(pieceId);
  };

  const handleFurnitureUpdate = (pieceId: string, updates: Partial<PlacedFurniturePiece>) => {
    setPlacedFurniture(prev =>
      prev.map(p => (p.id === pieceId ? { ...p, ...updates } : p))
    );
  };

  const handleFurnitureDelete = (pieceId: string) => {
    setPlacedFurniture(prev => prev.filter(p => p.id !== pieceId));
    setSelectedPieceId(null);
  };

  return (
    <AppLayout title="3D Floor Plans">
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Left Panel - 2D/3D Canvas */}
        <div className="flex-1 flex flex-col border-r border-slate-200 relative">
          {/* Toolbar */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg flex flex-col gap-1 border border-slate-200">
              <button className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <span className="material-symbols-outlined">straighten</span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <span className="material-symbols-outlined">door_front</span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <span className="material-symbols-outlined">window</span>
              </button>
              <div className="h-px bg-slate-200 my-1" />
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
            </div>
          </div>

          {/* Scale Badge */}
          {floorPlanData && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest text-slate-600 border border-slate-200 uppercase">
                Scale 1:50
              </div>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 bg-slate-100 relative overflow-hidden">
            {!preview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                  isDragging ? 'bg-blue-50 ring-2 ring-blue-400' : ''
                }`}
              >
                <span className="material-symbols-outlined text-6xl text-slate-400">upload_file</span>
                <div className="text-center">
                  <p className="font-semibold text-slate-700">Drop your floor plan here</p>
                  <p className="text-sm text-slate-500">or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <FloorPlan3DViewer
                floorPlanData={floorPlanData ?? undefined}
                furniture={placedFurniture}
                selectedPieceId={selectedPieceId}
                onFurniturePlace={handleFurniturePlace}
                onFurnitureSelect={handleFurnitureSelect}
                onFurnitureUpdate={handleFurnitureUpdate}
                cameraPreset={cameraPreset}
                lightingMode={lightingMode}
                firstPerson={isFirstPerson}
              />
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold text-slate-700">Analyzing floor plan...</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="h-12 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex gap-4">
              <span>X: 0.00</span>
              <span>Y: 0.00</span>
              {floorPlanData && (
                <span className="text-blue-600 font-medium">Area: {floorPlanData.totalArea} m²</span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <span className="material-symbols-outlined text-sm">grid_on</span>
              <span className="material-symbols-outlined text-sm">near_me</span>
            </div>
          </div>
        </div>

        {/* Right Panel - 3D Preview & Controls */}
        <div className="w-96 flex flex-col bg-white">
          <div className="p-4 flex justify-between items-center border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Live 3D Preview</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setLightingMode(lightingMode === 'day' ? 'night' : 'day')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  {lightingMode === 'day' ? 'wb_sunny' : 'dark_mode'}
                </span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">fullscreen</span>
              </button>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex gap-2">
              {(['perspective', 'top', 'front', 'side'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setCameraPreset(preset)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    cameraPreset === preset
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* First Person Toggle */}
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => setIsFirstPerson(!isFirstPerson)}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isFirstPerson
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              {isFirstPerson ? 'Exit Walkthrough' : 'Start Walkthrough'}
            </button>
          </div>

          {/* Selected Furniture Controls */}
          {selectedPieceId && (
            <div className="p-4 border-b border-slate-200 bg-blue-50">
              <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider mb-3">Selected Furniture</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const piece = placedFurniture.find(p => p.id === selectedPieceId);
                    if (piece) handleFurnitureUpdate(selectedPieceId, { rotation: piece.rotation - Math.PI / 4 });
                  }}
                  className="flex-1 py-2 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 border border-slate-200"
                >
                  ↺ Rotate Left
                </button>
                <button
                  onClick={() => {
                    const piece = placedFurniture.find(p => p.id === selectedPieceId);
                    if (piece) handleFurnitureUpdate(selectedPieceId, { rotation: piece.rotation + Math.PI / 4 });
                  }}
                  className="flex-1 py-2 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 border border-slate-200"
                >
                  ↻ Rotate Right
                </button>
                <button
                  onClick={() => handleFurnitureDelete(selectedPieceId)}
                  className="py-2 px-3 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Placed Furniture List */}
          {placedFurniture.length > 0 && (
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Placed Furniture ({placedFurniture.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {placedFurniture.map((piece) => (
                  <div
                    key={piece.id}
                    onClick={() => handleFurnitureSelect(piece.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                      selectedPieceId === piece.id
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-slate-600">chair</span>
                    <span className="text-sm font-medium flex-1">{piece.furniture.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 text-center text-sm text-slate-500">
            <p>Select furniture from the bottom panel</p>
            <p className="text-xs mt-1">Click on the floor to place</p>
          </div>
        </div>
      </div>

      {/* Bottom Asset Panel */}
      <div className="h-48 border-t border-slate-200 bg-white flex">
        {/* Tabs */}
        <div className="w-48 border-r border-slate-200 p-4 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'materials'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined">texture</span>
            Materials
          </button>
          <button
            onClick={() => setActiveTab('furniture')}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'furniture'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined">chair</span>
            Furniture
          </button>
          <button
            onClick={() => setActiveTab('lighting')}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'lighting'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined">lightbulb</span>
            Lighting
          </button>
        </div>

        {/* Asset Grid */}
        <div className="flex-1 p-4 overflow-x-auto flex items-center gap-4">
          {activeTab === 'materials' && materialOptions.map((mat) => (
            <div key={mat.id} className="flex-shrink-0 w-28 cursor-pointer group">
              <div 
                className="aspect-video rounded-xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-blue-600 transition-all"
                style={{ backgroundColor: mat.color }}
              />
              <p className="text-xs font-bold text-center">{mat.name}</p>
            </div>
          ))}

          {activeTab === 'furniture' && (
            <div className="flex items-center gap-4 w-full overflow-x-auto">
              <FurnitureLibrary
                selectedFurniture={selectedFurnitureItem}
                onSelectFurniture={setSelectedFurnitureItem}
                compact
              />
            </div>
          )}

          {activeTab === 'lighting' && (
            <>
              <div className="flex-shrink-0 w-28 cursor-pointer group">
                <div className="aspect-video bg-amber-100 rounded-xl overflow-hidden mb-2 border-2 border-amber-400" />
                <p className="text-xs font-bold text-center">Daylight</p>
              </div>
              <div className="flex-shrink-0 w-28 cursor-pointer group">
                <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-blue-600" />
                <p className="text-xs font-bold text-center">Night</p>
              </div>
              <div className="flex-shrink-0 w-28 cursor-pointer group">
                <div className="aspect-video bg-gradient-to-r from-orange-200 to-amber-300 rounded-xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-blue-600" />
                <p className="text-xs font-bold text-center">Sunset</p>
              </div>
            </>
          )}
        </div>

        {/* AI Suggestion */}
        <div className="w-64 border-l border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-emerald-500 text-sm">auto_awesome</span>
              <span className="text-[10px] font-bold text-blue-600 tracking-tighter uppercase">AI Suggestion</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Based on room size, <span className="text-blue-600 font-bold">Natural Oak</span> flooring is recommended to enhance perceived space.
            </p>
          </div>
          <button className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
            Apply Smart Material
          </button>
        </div>
      </div>

      {/* Floating Stats */}
      {floorPlanData && (
        <div className="fixed bottom-56 left-72 z-50 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl flex gap-8 pointer-events-auto border border-white/10">
            <div className="flex flex-col">
              <span className="text-[9px] text-white/60 uppercase font-bold tracking-widest">Floor Area</span>
              <span className="text-white font-bold text-lg">{floorPlanData.totalArea} m²</span>
            </div>
            <div className="w-px bg-white/10 h-10" />
            <div className="flex flex-col">
              <span className="text-[9px] text-white/60 uppercase font-bold tracking-widest">Bedrooms</span>
              <span className="text-emerald-400 font-bold text-lg">{floorPlanData.bedroomCount}</span>
            </div>
            <div className="w-px bg-white/10 h-10" />
            <div className="flex flex-col">
              <span className="text-[9px] text-white/60 uppercase font-bold tracking-widest">Bathrooms</span>
              <span className="text-emerald-400 font-bold text-lg">{floorPlanData.bathroomCount}</span>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
