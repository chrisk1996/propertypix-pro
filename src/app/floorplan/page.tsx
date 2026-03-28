'use client';

import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { Upload, FileImage, Box, Loader2, Download, RotateCcw, Camera, Sun, Moon, Eye, Trash2 } from 'lucide-react'; import FurnitureLibrary, { type FurnitureItem } from '@/components/FurnitureLibrary'; import type { PlacedFurniturePiece } from '@/components/PlacedFurniture';
import Link from 'next/link';
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

export default function FloorPlanPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'llava' | 'llama32'>('llama32');
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'top' | 'front' | 'side' | 'walkthrough'>('perspective');
  const [lightingMode, setLightingMode] = useState<'day' | 'night'>('day');
  const [isFirstPerson, setIsFirstPerson] = useState(false); const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniturePiece[]>([]); const [selectedFurnitureItem, setSelectedFurnitureItem] = useState<FurnitureItem | null>(null); const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
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
    setUploadedFile(file);
    setFloorPlanData(null);
    setAnalysisText(null);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF placeholder
      setPreview(null);
    }
  };

  const handleGenerate3D = async () => {
    if (!preview) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/floorplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview, model: selectedModel }),
      });

      const data = await response.json();
      console.log('API full response:', JSON.stringify(data, null, 2));
    console.log('modelData.rooms:', data.modelData?.rooms);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process floor plan');
      }

      setFloorPlanData(data.modelData);
      setAnalysisText(data.analysis);
    } catch (err) {
      console.error('Floor plan processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate 3D model');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPreview(null);
    setFloorPlanData(null);
    setAnalysisText(null);
    setError(null);
  };

  const handleFurniturePlace = useCallback((position: [number, number, number]) => { if (!selectedFurnitureItem) return; const newPiece: PlacedFurniturePiece = { id: `${selectedFurnitureItem.id}-${Date.now()}`, furniture: selectedFurnitureItem, position, rotation: 0, scale: 1 }; setPlacedFurniture(prev => [...prev, newPiece]); }, [selectedFurnitureItem]); const handleFurnitureSelect = useCallback((id: string) => { setSelectedPieceId(id); }, []); const handleFurnitureUpdate = useCallback((id: string, updates: Partial<PlacedFurniturePiece>) => { setPlacedFurniture(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p)); }, []); const handleDeleteSelected = useCallback(() => { if (selectedPieceId) { setPlacedFurniture(prev => prev.filter(p => p.id !== selectedPieceId)); setSelectedPieceId(null); } }, [selectedPieceId]); const handleExportGLB = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('export-glb'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
            <Box className="w-4 h-4" />
            Floor Plan to 3D
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Convert Floor Plans to 3D Models
          </h1>
          <p className="text-gray-600">
            Upload a 2D floor plan and we&apos;ll generate an interactive 3D model
          </p>
        </div>

        {floorPlanData && (
 <div className="w-72 shrink-0">
 <FurnitureLibrary 
 selectedFurniture={selectedFurnitureItem} 
 onSelectFurniture={setSelectedFurnitureItem} 
 />
 {selectedPieceId && (
 <div className="mt-2 space-y-2">
 <div className="flex gap-2">
 <button 
 onClick={() => handleFurnitureUpdate(selectedPieceId, { rotation: (placedFurniture.find(p => p.id === selectedPieceId)?.rotation || 0) - Math.PI / 4 })}
 className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
 >
 ↺ Left
 </button>
 <button 
 onClick={() => handleFurnitureUpdate(selectedPieceId, { rotation: (placedFurniture.find(p => p.id === selectedPieceId)?.rotation || 0) + Math.PI / 4 })}
 className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
 >
 ↻ Right
 </button>
 </div>
 <button 
 onClick={handleDeleteSelected}
 className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
 >
 <Trash2 className="w-4 h-4" />
 Delete
 </button>
 </div>
 )}
 </div>
 )}
 <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Floor Plan</h2>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!uploadedFile ? (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop your floor plan here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports PNG, JPG, PDF (max 20MB)
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Browse files
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Floor plan preview"
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-3 p-6 bg-gray-100 rounded-lg">
                      <FileImage className="w-8 h-8 text-gray-400" />
                      <span className="text-gray-600">{uploadedFile.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            {uploadedFile && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleGenerate3D}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Box className="w-5 h-5" />
                      Generate 3D Model
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {analysisText && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Analysis</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{analysisText}</p>
              </div>
            )}

            {/* Stats */}
            {floorPlanData && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-700">{floorPlanData.rooms.length}</p>
                  <p className="text-sm text-purple-600">Rooms</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{floorPlanData.bedroomCount}</p>
                  <p className="text-sm text-blue-600">Bedrooms</p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-cyan-700">{floorPlanData.bathroomCount}</p>
                  <p className="text-sm text-cyan-600">Bathrooms</p>
                </div>
              </div>
            )}
          </div>

          {/* 3D Viewer Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">3D Model</h2>
 {floorPlanData && (
 <div className="flex gap-2">
 <div className="flex gap-1">
 {[
 { key: 'perspective', label: '3D' },
 { key: 'top', label: 'Top' },
 { key: 'front', label: 'Front' },
 { key: 'side', label: 'Side' },
 ].map(({ key, label }) => (
 <button
 key={key}
 onClick={() => setCameraPreset(key as 'perspective' | 'top' | 'front' | 'side' | 'walkthrough')}
 className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${cameraPreset === key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
 >
 {label}
 </button>
 ))}
 </div>
 <button
 onClick={() => setLightingMode(lightingMode === 'day' ? 'night' : 'day')}
 className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
 >
 {lightingMode === 'day' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
 </button>
 <button
 onClick={handleExportGLB}
 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
 >
 <Download className="w-4 h-4" />
 Export
 </button>
 </div>
 )}
 </div>
 
 <div className="h-[400px] bg-gray-100 rounded-xl overflow-hidden">
              {floorPlanData ? (
                <FloorPlan3DViewer floorPlanData={floorPlanData} cameraPreset={cameraPreset} lightingMode={lightingMode} firstPerson={isFirstPerson} furniture={placedFurniture} selectedFurnitureItem={selectedFurnitureItem} selectedPieceId={selectedPieceId} onFurniturePlace={handleFurniturePlace} onFurnitureSelect={handleFurnitureSelect} onFurnitureUpdate={handleFurnitureUpdate} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Upload a floor plan to see the 3D model</p>
                  </div>
                </div>
              )}
            </div>

            {/* Room Legend */}
            {floorPlanData && floorPlanData.rooms.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Rooms:</h3>
                <div className="flex flex-wrap gap-2">
                  {floorPlanData.rooms.map((room, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {room.name} ({room.width}m × {room.height}m)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-purple-50 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-3">How it works:</h3>
          <ol className="space-y-2 text-purple-800">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-medium">1</span>
              Upload your 2D floor plan (image or PDF)
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-medium">2</span>
              AI analyzes the layout and identifies walls, rooms, and features
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-medium">3</span>
              Get an interactive 3D model you can explore and export
            </li>
          </ol>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
