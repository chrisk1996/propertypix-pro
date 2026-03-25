'use client';

import { Suspense, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Download, RotateCcw, Trash2 } from 'lucide-react';
import FurnitureLibrary, { type FurnitureItem } from '@/components/FurnitureLibrary';
import type { PlacedFurniturePiece } from '@/components/PlacedFurniture';

// Dynamically import 3D viewer to avoid SSR issues
const FloorPlan3DViewer = dynamic(
  () => import('@/components/FloorPlan3DViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        Loading 3D...
      </div>
    ),
  }
);

export default function FloorPlan3DPage() {
  // Furniture state
  const [selectedFurnitureItem, setSelectedFurnitureItem] = useState<FurnitureItem | null>(null);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniturePiece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  // Handle furniture placement
  const handleFurniturePlace = useCallback((position: [number, number, number]) => {
    if (!selectedFurnitureItem) return;

    const newPiece: PlacedFurniturePiece = {
      id: `${selectedFurnitureItem.id}-${Date.now()}`,
      furniture: selectedFurnitureItem,
      position,
      rotation: 0,
      scale: 1,
    };

    setPlacedFurniture(prev => [...prev, newPiece]);
    setSelectedPieceId(newPiece.id);
  }, [selectedFurnitureItem]);

  // Handle furniture selection in 3D view
  const handleFurnitureSelect = useCallback((id: string) => {
    setSelectedPieceId(id);
    // Deselect library item when selecting placed furniture
    setSelectedFurnitureItem(null);
  }, []);

  // Handle furniture updates (rotation, scale)
  const handleFurnitureUpdate = useCallback((id: string, updates: Partial<PlacedFurniturePiece>) => {
    setPlacedFurniture(prev =>
      prev.map(piece =>
        piece.id === id ? { ...piece, ...updates } : piece
      )
    );
  }, []);

  // Rotate selected piece
  const handleRotatePiece = useCallback(() => {
    if (!selectedPieceId) return;
    setPlacedFurniture(prev =>
      prev.map(piece =>
        piece.id === selectedPieceId
          ? { ...piece, rotation: piece.rotation + Math.PI / 2 }
          : piece
      )
    );
  }, [selectedPieceId]);

  // Delete selected piece
  const handleDeletePiece = useCallback(() => {
    if (!selectedPieceId) return;
    setPlacedFurniture(prev => prev.filter(piece => piece.id !== selectedPieceId));
    setSelectedPieceId(null);
  }, [selectedPieceId]);

  // Clear all furniture
  const handleClearAll = useCallback(() => {
    setPlacedFurniture([]);
    setSelectedPieceId(null);
    setSelectedFurnitureItem(null);
  }, []);

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Left Sidebar - Furniture Library */}
      <FurnitureLibrary
        selectedFurniture={selectedFurnitureItem}
        onSelectFurniture={setSelectedFurnitureItem}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/floorplan"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-white font-semibold">3D Floor Plan Editor</h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {selectedPieceId && (
              <>
                <button
                  onClick={handleRotatePiece}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rotate
                </button>
                <button
                  onClick={handleDeletePiece}
                  className="flex items-center gap-2 px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Clear All
            </button>
          </div>

          {/* Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Trigger export via custom event
                const event = new CustomEvent('export-glb');
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export GLB
            </button>
          </div>
        </header>

        {/* 3D Viewer */}
        <main className="flex-1 relative">
          <Suspense
            fallback={
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
                Loading 3D viewer...
              </div>
            }
          >
            <FloorPlan3DViewer
              className="w-full h-full"
              furniture={placedFurniture}
              selectedFurnitureItem={selectedFurnitureItem}
              selectedPieceId={selectedPieceId}
              onFurniturePlace={handleFurniturePlace}
              onFurnitureSelect={handleFurnitureSelect}
              onFurnitureUpdate={handleFurnitureUpdate}
            />
          </Suspense>

          {/* Info overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 text-white text-sm max-w-xs">
            <h3 className="font-semibold mb-2">Controls</h3>
            <ul className="space-y-1 text-gray-300">
              <li>🖱️ Left click + drag: Rotate view</li>
              <li>🖱️ Right click + drag: Pan view</li>
              <li>🖱️ Scroll: Zoom in/out</li>
              <li>📦 Click furniture, then click floor to place</li>
            </ul>
          </div>

          {/* Status overlay */}
          <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
            {placedFurniture.length > 0 ? (
              <span>📦 {placedFurniture.length} piece{placedFurniture.length !== 1 ? 's' : ''} placed</span>
            ) : (
              <span className="text-gray-400">Select furniture from the library</span>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
