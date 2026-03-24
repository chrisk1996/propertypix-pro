'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Download, RotateCcw, Maximize2, Move } from 'lucide-react';

// Dynamically import 3D viewer to avoid SSR issues
const FloorPlan3DViewer = dynamic(
  () => import('@/components/FloorPlan3DViewer'),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading 3D...</div> }
);

export default function FloorPlan3DPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-900">
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
          <h1 className="text-white font-semibold">3D Floor Plan Viewer</h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm">
            <Move className="w-4 h-4" />
            Orbit
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm">
            <Maximize2 className="w-4 h-4" />
            Fullscreen
          </button>
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
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
          <FloorPlan3DViewer className="w-full h-full" />
        </Suspense>

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 text-white text-sm max-w-xs">
          <h3 className="font-semibold mb-2">Controls</h3>
          <ul className="space-y-1 text-gray-300">
            <li>🖱️ Left click + drag: Rotate view</li>
            <li>🖱️ Right click + drag: Pan view</li>
            <li>🖱️ Scroll: Zoom in/out</li>
          </ul>
        </div>

        {/* Coming soon overlay */}
        <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
          🚧 Preview Mode - Full editing coming soon
        </div>
      </main>
    </div>
  );
}
