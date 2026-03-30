'use client';

import { useState } from 'react';
import { exportAsSVG, exportAsGLTF, createFloorPlan3DScene } from './ExportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | HTMLDivElement | null>;
  walls: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: string;
    thickness?: number;
  }>;
  rooms: Array<{
    id: string;
    name: string;
    type: string;
    points: number[];
  }>;
}

type ExportFormat = 'png' | 'pdf' | 'svg' | 'glb' | 'gltf';

export default function ExportModal({ isOpen, onClose, canvasRef, walls, rooms }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `floorplan-${timestamp}`;

      switch (format) {
        case 'png':
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            // Find the actual Konva canvas inside
            const konvaCanvas = canvas.querySelector('canvas') || canvas;
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = (konvaCanvas as HTMLCanvasElement).toDataURL('image/png');
            link.click();
          }
          break;

        case 'pdf':
          if (canvasRef.current) {
            const konvaCanvas = canvasRef.current.querySelector('canvas') || canvasRef.current;
            const url = (konvaCanvas as HTMLCanvasElement).toDataURL('image/png');
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`
                <html>
                  <head><title>${filename}</title></head>
                  <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                    <img src="${url}" style="max-width:100%;height:auto;">
                    <script>window.print();</script>
                  </body>
                </html>
              `);
              printWindow.document.close();
            }
          }
          break;

        case 'svg':
          exportAsSVG(walls, rooms, `${filename}.svg`);
          break;

        case 'glb':
        case 'gltf': {
          // Convert 2D floor plan data to 3D format
          const rooms3D = rooms.map(r => ({
            name: r.name,
            x: r.points[0] / 20,
            y: r.points[1] / 20,
            width: (r.points[4] - r.points[0]) / 20,
            height: (r.points[5] - r.points[1]) / 20,
            type: r.type,
          }));

          const walls3D = walls.map(w => ({
            start: [w.x1 / 20, w.y1 / 20] as [number, number],
            end: [w.x2 / 20, w.y2 / 20] as [number, number],
            type: w.type as 'exterior' | 'interior',
          }));

          const scene = createFloorPlan3DScene({ rooms: rooms3D, walls: walls3D });
          await exportAsGLTF(scene, `${filename}.${format}`, { binary: format === 'glb' });
          break;
        }
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formats: Array<{ id: ExportFormat; label: string; description: string }> = [
    { id: 'png', label: 'PNG', description: 'High-quality raster image' },
    { id: 'pdf', label: 'PDF', description: 'Print-ready document' },
    { id: 'svg', label: 'SVG', description: 'Scalable vector graphics' },
    { id: 'glb', label: 'GLB', description: '3D model (binary)' },
    { id: 'gltf', label: 'GLTF', description: '3D model (JSON)' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Export Floor Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                format === f.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    format === f.id
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {format === f.id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <span className="font-semibold text-slate-900">{f.label}</span>
              </div>
              <span className="text-sm text-slate-500">{f.description}</span>
            </button>
          ))}
        </div>

        {(format === 'glb' || format === 'gltf') && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
              <p className="text-sm text-amber-800">
                3D export creates a basic room structure from your 2D floor plan.
                Best viewed in 3D modeling software like Blender.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
