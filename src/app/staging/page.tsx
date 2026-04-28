'use client';

import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { useTranslations } from 'next-intl';
import { StagingPanel } from '@/components/media/StagingPanel';

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
  const [stagingMeta, setStagingMeta] = useState<{ roomType: string; furnitureStyle: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setStagedImage(null);
        setStagingMeta(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResult = (resultUrl: string, metadata: { roomType: string; furnitureStyle: string; model: string; creditsUsed: number }) => {
    setStagedImage(resultUrl);
    setStagingMeta({ roomType: metadata.roomType, furnitureStyle: metadata.furnitureStyle });
  };

  const handleError = (error: string) => {
    // StagingPanel handles its own error display, but we can log or add page-level handling here
    console.error('Staging error:', error);
  };

  const handleDownload = () => {
    if (!stagedImage) return;
    const a = document.createElement('a');
    a.href = stagedImage;
    a.download = `staged-${stagingMeta?.furnitureStyle || 'modern'}-${Date.now()}.png`;
    a.click();
  };

  return (
    <AppLayout title={ts("title")}>
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Left Panel - Controls */}
        <div className="w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-sm mb-1">
              Virtual Staging
            </h3>
            <p className="text-slate-500 text-xs mb-6">AI-powered furniture placement</p>

            <StagingPanel
              image={uploadedImage}
              onResult={handleResult}
              onError={handleError}
            />

            {/* Download / Reset */}
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
                  onClick={() => { setUploadedImage(null); setStagedImage(null); setStagingMeta(null); }}
                  className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Upload New Photo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-8 overflow-auto">
          {!uploadedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-4xl max-h-[calc(100vh-16rem)] aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
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
            <div className="w-full max-w-4xl max-h-[calc(100vh-16rem)]">
              <ImageCompareSlider beforeSrc={uploadedImage} afterSrc={stagedImage} />
              <div className="mt-6 bg-purple-50 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-purple-800">
                  <strong>Result:</strong> {stagingMeta?.roomType || 'room'} with{' '}
                  <strong>{stagingMeta?.furnitureStyle || 'modern'}</strong> style.
                  Drag the slider to compare before and after.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-4xl max-h-[calc(100vh-16rem)]">
              <img src={uploadedImage} alt="Uploaded" className="w-full max-h-[calc(100vh-20rem)] object-contain rounded-2xl shadow-2xl" />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white"
              >
                <span className="material-symbols-outlined text-slate-600">close</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
