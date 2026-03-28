'use client';

import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout';

type EnhancementTool = 'auto-lighting' | 'denoise' | 'sky-replacement' | null;
type StagingRoom = 'living-room' | 'bedroom' | 'dining' | 'home-office' | null;

const enhancementTools = [
  { id: 'auto-lighting' as const, icon: 'light_mode', label: 'Auto-Lighting', description: 'Perfect exposure balance' },
  { id: 'denoise' as const, icon: 'grain', label: 'Denoise & Sharp', description: 'Crystal clear detail' },
  { id: 'sky-replacement' as const, icon: 'wb_twilight', label: 'Sky Replacement', description: 'Dramatic sky transforms' },
];

const stagingRooms = [
  { id: 'living-room' as const, icon: 'weekend', label: 'Living Room' },
  { id: 'bedroom' as const, icon: 'bed', label: 'Bedroom' },
  { id: 'dining' as const, icon: 'table_restaurant', label: 'Dining' },
  { id: 'home-office' as const, icon: 'desk', label: 'Home Office' },
];

const mockFurniture = [
  { id: '1', name: 'Modern Sofa', category: 'Seating' },
  { id: '2', name: 'Accent Chair', category: 'Seating' },
  { id: '3', name: 'Coffee Table', category: 'Tables' },
  { id: '4', name: 'Floor Lamp', category: 'Lighting' },
  { id: '5', name: 'Plant Stand', category: 'Decor' },
  { id: '6', name: 'Bookshelf', category: 'Storage' },
];

export default function EnhancePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<EnhancementTool>(null);
  const [selectedRoom, setSelectedRoom] = useState<StagingRoom>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = () => {
    if (!uploadedImage || !selectedTool) return;
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <AppLayout title="Image Enhancer">
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Left Sidebar - AI Enhancement Tools */}
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-1">AI Enhancement</h3>
            <p className="text-slate-500 text-xs mb-4">Studio-grade image processing</p>
            
            <div className="space-y-2">
              {enhancementTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  disabled={!uploadedImage || isProcessing}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    selectedTool === tool.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="material-symbols-outlined">{tool.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{tool.label}</div>
                    <div className="text-xs opacity-75">{tool.description}</div>
                  </div>
                </button>
              ))}
            </div>

            {selectedTool && uploadedImage && (
              <button
                onClick={handleEnhance}
                disabled={isProcessing}
                className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Apply Enhancement'}
              </button>
            )}
          </div>

          {/* Virtual Staging Section */}
          <div className="p-6 border-t border-slate-200">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-1">Virtual Staging</h3>
            <p className="text-slate-500 text-xs mb-4">AI furniture placement</p>
            
            <div className="grid grid-cols-2 gap-2">
              {stagingRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  disabled={!uploadedImage}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    selectedRoom === room.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="material-symbols-outlined">{room.icon}</span>
                  <span className="text-xs font-semibold">{room.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Photo Canvas */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-8">
          {!uploadedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl aspect-video bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
            >
              <span className="material-symbols-outlined text-5xl text-slate-400">add_photo_alternate</span>
              <div className="text-center">
                <p className="font-semibold text-slate-700">Drop your image here</p>
                <p className="text-sm text-slate-500">or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative w-full max-w-4xl">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="w-full rounded-2xl shadow-2xl"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="bg-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-slate-700">Processing...</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-slate-600">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Catalog */}
        <div className="w-80 shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-4">Furniture Catalog</h3>
            
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search furniture..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {mockFurniture.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-blue-50 hover:ring-2 hover:ring-blue-200 transition-all"
                >
                  <span className="material-symbols-outlined text-2xl text-slate-600">chair</span>
                  <span className="text-xs font-semibold text-slate-700 text-center">{item.name}</span>
                  <span className="text-[10px] text-slate-500">{item.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scene Layers */}
          <div className="p-6 border-t border-slate-200">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-4">Scene Objects</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="material-symbols-outlined text-sm text-blue-600">visibility</span>
                <span className="text-sm font-medium flex-1">Original Photo</span>
                <span className="material-symbols-outlined text-sm text-slate-400">lock</span>
              </div>
              {uploadedImage && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="material-symbols-outlined text-sm text-blue-600">visibility</span>
                  <span className="text-sm font-medium flex-1">Enhancement Layer</span>
                  <span className="material-symbols-outlined text-sm text-slate-400">more_vert</span>
                </div>
              )}
            </div>
          </div>

          {/* Smart Layout Generator */}
          <div className="p-6 border-t border-slate-200">
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">auto_awesome_motion</span>
              Smart Layout Generator
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
