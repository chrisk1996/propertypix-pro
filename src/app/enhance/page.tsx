'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { 
  Upload, 
  Sparkles, 
  Download, 
  RotateCcw, 
  Sun, 
  Contrast, 
  Home,
  Check
} from 'lucide-react';

type EnhancementType = 'auto' | 'sky' | 'staging' | 'hdr';

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
  { id: 'hdr', name: 'hdr', label: 'HDR Effect', icon: <Contrast className="w-5 h-5" />, description: 'High dynamic range tone mapping' },
];

export default function EnhancePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementType>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setEnhancedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!uploadedImage) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo, we'll use the same image with a filter effect
    setEnhancedImage(uploadedImage);
    setIsProcessing(false);
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
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

        {/* Upload Area */}
        {!uploadedImage && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Enhancement Type</h3>
                <div className="space-y-2">
                  {enhancements.map((enhancement) => (
                    <button
                      key={enhancement.id}
                      onClick={() => setSelectedEnhancement(enhancement.id as EnhancementType)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedEnhancement === enhancement.id
                          ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                          : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`${
                        selectedEnhancement === enhancement.id ? 'text-indigo-600' : 'text-gray-400'
                      }`}>
                        {enhancement.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{enhancement.label}</div>
                        <div className="text-xs text-gray-500">{enhancement.description}</div>
                      </div>
                      {selectedEnhancement === enhancement.id && (
                        <Check className="w-5 h-5 text-indigo-600 ml-auto" />
                      )}
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Enhance Photo
                    </>
                  )}
                </button>

                {/* Action Buttons */}
                {enhancedImage && (
                  <div className="mt-4 space-y-2">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Download Result
                    </button>
                    <button 
                      onClick={() => {
                        setUploadedImage(null);
                        setEnhancedImage(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Start Over
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
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded property" 
                      className="w-full h-auto rounded-lg"
                    />
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      Original
                    </div>
                  </div>
                ) : (
                  /* Before/After Comparison Slider */
                  <div 
                    ref={sliderRef}
                    className="relative overflow-hidden rounded-lg cursor-ew-resize select-none"
                    onMouseMove={handleSliderMove}
                    onClick={handleSliderMove}
                  >
                    {/* After Image (Bottom Layer) */}
                    <div className="relative">
                      <img 
                        src={enhancedImage} 
                        alt="Enhanced property" 
                        className="w-full h-auto"
                        style={{ filter: 'contrast(1.1) saturate(1.2) brightness(1.05)' }}
                      />
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
                      <img 
                        src={uploadedImage} 
                        alt="Original property" 
                        className="w-full h-auto"
                      />
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        Original
                      </div>
                    </div>

                    {/* Slider Handle */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
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
              </div>

              {/* Tips */}
              {enhancedImage && (
                <div className="mt-4 bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm text-indigo-700">
                    <strong>Tip:</strong> Drag the slider left and right to compare the before and after. 
                    Click "Download Result" to save the enhanced image.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
