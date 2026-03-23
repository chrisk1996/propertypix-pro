'use client';

import { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Upload, Sparkles, Download, RotateCcw, Sun, Contrast, Home, Check, Eraser, AlertCircle } from 'lucide-react';

type EnhancementType = 'auto' | 'sky' | 'staging' | 'object_removal';

interface Enhancement {
  id: string;
  name: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const enhancements: Enhancement[] = [
  { id: 'auto', name: 'auto', label: 'Auto Enhance', icon: <Sparkles className="w-5 h-5" />, description: 'AI-powered one-click enhancement' },
  { id: 'sky', name: 'sky', label: 'Sky Replace', icon: <Sun className="w-5 h-5" />, description: 'Replace dull skies with beautiful ones' },
  { id: 'staging', name: 'staging', label: 'Virtual Staging', icon: <Home className="w-5 h-5" />, description: 'Add virtual furniture to empty rooms' },
  { id: 'object_removal', name: 'object_removal', label: 'Object Removal', icon: <Eraser className="w-5 h-5" />, description: 'Remove unwanted objects from photos' },
];

export default function EnhancePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementType>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

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
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setEnhancedImage(null);
      setProgress(0);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          enhancementType: selectedEnhancement,
        }),
      });

      const data = await response.json();
      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance image');
      }

      setProgress(100);
      setEnhancedImage(data.output);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!enhancedImage) return;

    try {
      const response = await fetch(enhancedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enhanced-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(enhancedImage, '_blank');
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!sliderRef.current || !isSliderDragging) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const startSliderDrag = () => setIsSliderDragging(true);
  const stopSliderDrag = () => setIsSliderDragging(false);

  const resetUpload = () => {
    setUploadedImage(null);
    setEnhancedImage(null);
    setProgress(0);
    setError(null);
    setSliderPosition(50);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Enhancement</h1>
          <p className="text-gray-600">Upload your property photos and enhance them with AI</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!uploadedImage && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload your photo</h3>
            <p className="text-gray-500 mb-4">Drag and drop or click to browse</p>
            <p className="text-sm text-gray-400">Supports JPG, PNG, WebP up to 10MB</p>
          </div>
        )}

        {/* Enhancement Interface */}
        {uploadedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Enhancement Options Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-4">Enhancement Type</h3>
                <div className="space-y-2">
                  {enhancements.map((enhancement) => (
                    <button
                      key={enhancement.id}
                      onClick={() => setSelectedEnhancement(enhancement.id as EnhancementType)}
                      disabled={isProcessing}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedEnhancement === enhancement.id
                          ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                          : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={selectedEnhancement === enhancement.id ? 'text-indigo-600' : 'text-gray-400'}>
                        {enhancement.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{enhancement.label}</div>
                        <div className="text-xs text-gray-500">{enhancement.description}</div>
                      </div>
                      {selectedEnhancement === enhancement.id && <Check className="w-5 h-5 text-indigo-600 ml-auto" />}
                    </button>
                  ))}
                </div>

                {/* Enhance Button */}
                <button
                  onClick={handleEnhance}
                  disabled={isProcessing}
                  className={`w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Enhance Photo
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Processing</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {enhancedImage && !isProcessing && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Result
                    </button>
                    <button
                      onClick={resetUpload}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Upload New Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Image Comparison Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {!enhancedImage ? (
                  /* Single Image Display */
                  <div className="relative">
                    <img src={uploadedImage} alt="Uploaded property" className="w-full h-auto rounded-lg" />
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      Original
                    </div>
                  </div>
                ) : (
                  /* Before/After Comparison Slider */
                  <div
                    ref={sliderRef}
                    className="relative overflow-hidden rounded-lg cursor-ew-resize select-none"
                    onMouseDown={startSliderDrag}
                    onMouseUp={stopSliderDrag}
                    onMouseLeave={stopSliderDrag}
                    onMouseMove={handleSliderMove}
                    onTouchStart={startSliderDrag}
                    onTouchEnd={stopSliderDrag}
                    onTouchMove={handleSliderMove}
                  >
                    {/* After Image (Bottom Layer) */}
                    <div className="relative">
                      <img src={enhancedImage} alt="Enhanced property" className="w-full h-auto" />
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Enhanced
                      </div>
                    </div>

                    {/* Before Image (Top Layer with clip) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img src={uploadedImage} alt="Original property" className="w-full h-auto" />
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        Original
                      </div>
                    </div>

                    {/* Slider Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                      style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
                          <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips */}
                {enhancedImage && (
                  <div className="mt-4 bg-indigo-50 rounded-lg p-4">
                    <p className="text-sm text-indigo-700">
                      <strong>Tip:</strong> Drag the slider left and right to compare the before and after. Click "Download Result" to save the enhanced image.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
