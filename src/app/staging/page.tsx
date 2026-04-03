'use client';

import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import AIModelSelector, { type AIModel } from '@/components/AIModelSelector';

type StagingRoom = 'living' | 'bedroom' | 'kitchen' | 'dining' | 'office';
type FurnitureStyle = 'modern' | 'scandinavian' | 'luxury' | 'minimalist' | 'industrial';

const stagingRooms = [
  { id: 'living' as const, icon: 'weekend', label: 'Living Room' },
  { id: 'bedroom' as const, icon: 'bed', label: 'Bedroom' },
  { id: 'kitchen' as const, icon: 'kitchen', label: 'Kitchen' },
  { id: 'dining' as const, icon: 'table_restaurant', label: 'Dining' },
  { id: 'office' as const, icon: 'desk', label: 'Home Office' },
];

const furnitureStyles = [
  { id: 'modern' as const, label: 'Modern', icon: 'weekend' },
  { id: 'scandinavian' as const, label: 'Scandinavian', icon: 'chair' },
  { id: 'luxury' as const, label: 'Luxury', icon: 'diamond' },
  { id: 'minimalist' as const, label: 'Minimalist', icon: 'minimize' },
  { id: 'industrial' as const, label: 'Industrial', icon: 'factory' },
];

function ImageCompareSlider({ beforeSrc, afterSrc }: { beforeSrc: string; afterSrc: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none"
      onMouseDown={() => { isDragging.current = true; }}
      onMouseUp={() => { isDragging.current = false; }}
      onMouseLeave={() => { isDragging.current = false; }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchStart={() => { isDragging.current = true; }}
      onTouchEnd={() => { isDragging.current = false; }}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      <img src={afterSrc} alt="Staged" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img
          src={beforeSrc}
          alt="Original"
          className="absolute inset-0 h-full object-cover"
          style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-600 text-xl">compare_arrows</span>
        </div>
      </div>
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-lg">Before</div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">auto_awesome</span>
        Staged
      </div>
    </div>
  );
}

export default function VirtualStagingPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<StagingRoom>('living');
  const [selectedStyle, setSelectedStyle] = useState<FurnitureStyle>('modern');
  const [selectedModel, setSelectedModel] = useState<AIModel>('flux-depth');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setStagedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStaging = async () => {
    if (!uploadedImage) return;
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          roomType: selectedRoom,
          furnitureStyle: selectedStyle,
          model: selectedModel
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Staging failed');
      setStagedImage(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stage room');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!stagedImage) return;
    const a = document.createElement('a');
    a.href = stagedImage;
    a.download = `staged-${selectedStyle}-${Date.now()}.png`;
    a.click();
  };

  return (
    <AppLayout title="Virtual Staging">
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Left Panel - Controls */}
        <div className="w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-1">
              Virtual Staging
            </h3>
            <p className="text-slate-500 text-xs mb-6">AI-powered furniture placement</p>

            {/* Room Type Selection */}
            <label className="text-xs font-semibold text-slate-600 mb-3 block">Room Type</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {stagingRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  disabled={!uploadedImage || isProcessing}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    selectedRoom === room.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="material-symbols-outlined">{room.icon}</span>
                  <span className="text-xs font-semibold">{room.label}</span>
                </button>
              ))}
            </div>

            {/* Furniture Style Selection */}
            <label className="text-xs font-semibold text-slate-600 mb-3 block">Furniture Style</label>
            <div className="space-y-2 mb-6">
              {furnitureStyles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  disabled={!uploadedImage || isProcessing}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    selectedStyle === style.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="material-symbols-outlined">{style.icon}</span>
                  <span className="text-sm font-semibold">{style.label}</span>
                </button>
              ))}
            </div>

            {/* Stage Button */}
            <button
              onClick={handleStaging}
              disabled={!uploadedImage || isProcessing}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                uploadedImage && !isProcessing
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Staging...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  Stage Room
                </span>
              )}
            </button>

            {/* AI Model Selector */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <AIModelSelector category="staging" selected={selectedModel} onSelect={setSelectedModel} />
            </div>

            {/* Download Button */}
            {stagedImage && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">download</span>
                  Download Result
                </button>
                <button
                  onClick={() => { setUploadedImage(null); setStagedImage(null); }}
                  className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Upload New Photo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-8">
          {!uploadedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-4xl aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
            >
              <span className="material-symbols-outlined text-7xl text-slate-400">add_photo_alternate</span>
              <div className="text-center">
                <p className="font-semibold text-slate-700 text-lg">Upload your empty room photo</p>
                <p className="text-sm text-slate-500 mt-1">Drag and drop or click to browse</p>
                <p className="text-xs text-slate-400 mt-2">Supports JPG, PNG, WebP up to 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : stagedImage ? (
            <div className="w-full max-w-4xl">
              <ImageCompareSlider beforeSrc={uploadedImage} afterSrc={stagedImage} />
              <div className="mt-6 bg-purple-50 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-purple-800">
                  <strong>Result:</strong> {stagingRooms.find(r => r.id === selectedRoom)?.label} with{' '}
                  <strong>{furnitureStyles.find(s => s.id === selectedStyle)?.label}</strong> style.
                  Drag the slider to compare before and after.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-4xl">
              <img src={uploadedImage} alt="Uploaded" className="w-full rounded-2xl shadow-2xl" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="bg-white px-8 py-6 rounded-xl shadow-lg flex items-center gap-4">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="font-semibold text-slate-700">Staging your room...</p>
                      <p className="text-sm text-slate-500">This may take 30-60 seconds</p>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
                  {error}
                  <button onClick={() => setError(null)} className="font-bold text-lg">×</button>
                </div>
              )}
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white"
              >
                <span className="material-symbols-outlined text-slate-600">close</span>
              </button>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow">
                <p className="text-sm text-slate-700 font-semibold">
                  {stagingRooms.find(r => r.id === selectedRoom)?.label} • {furnitureStyles.find(s => s.id === selectedStyle)?.label}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
