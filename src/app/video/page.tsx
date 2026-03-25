'use client';

import { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { 
  Upload, 
  Play, 
  Download, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  ZoomIn, 
  ZoomOut, 
  Orbit, 
  AlertCircle,
  Loader2
} from 'lucide-react';

type MotionType = 'pan_left' | 'pan_right' | 'zoom_in' | 'zoom_out' | 'orbit';

interface MotionOption {
  id: MotionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const motionOptions: MotionOption[] = [
  {
    id: 'pan_left',
    label: 'Pan Left',
    icon: <ArrowLeft className="w-5 h-5" />,
    description: 'Smooth camera pan to the left'
  },
  {
    id: 'pan_right',
    label: 'Pan Right',
    icon: <ArrowRight className="w-5 h-5" />,
    description: 'Smooth camera pan to the right'
  },
  {
    id: 'zoom_in',
    label: 'Zoom In',
    icon: <ZoomIn className="w-5 h-5" />,
    description: 'Cinematic zoom into the scene'
  },
  {
    id: 'zoom_out',
    label: 'Zoom Out',
    icon: <ZoomOut className="w-5 h-5" />,
    description: 'Reveal more of the property'
  },
  {
    id: 'orbit',
    label: 'Orbit',
    icon: <Orbit className="w-5 h-5" />,
    description: '360° orbital movement'
  },
];

export default function VideoPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedMotion, setSelectedMotion] = useState<MotionType>('pan_left');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
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
      setVideoUrl(null);
      setProgress(0);
      setJobId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    // Simulate progress for UX (video generation takes longer)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 8;
      });
    }, 800);

    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          motionType: selectedMotion,
        }),
      });

      const data = await response.json();
      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      setProgress(100);
      setVideoUrl(data.output);
      setJobId(data.jobId);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(videoUrl, '_blank');
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setVideoUrl(null);
    setProgress(0);
    setError(null);
    setJobId(null);
    setSelectedMotion('pan_left');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Generation</h1>
          <p className="text-gray-600">
            Transform your property photos into cinematic videos with AI-powered motion
          </p>
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
                ? 'border-purple-500 bg-purple-50 scale-[1.02]'
                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload your property photo</h3>
            <p className="text-gray-500 mb-4">Drag and drop or click to browse</p>
            <p className="text-sm text-gray-400">Supports JPG, PNG, WebP up to 10MB</p>
          </div>
        )}

        {/* Video Generation Interface */}
        {uploadedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Motion Options Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-4">Motion Type</h3>
                <div className="space-y-2">
                  {motionOptions.map((motion) => (
                    <button
                      key={motion.id}
                      onClick={() => setSelectedMotion(motion.id)}
                      disabled={isProcessing}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedMotion === motion.id
                          ? 'bg-purple-50 border-2 border-purple-500 text-purple-700'
                          : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={selectedMotion === motion.id ? 'text-purple-600' : 'text-gray-400'}>
                        {motion.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{motion.label}</div>
                        <div className="text-xs text-gray-500">{motion.description}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateVideo}
                  disabled={isProcessing}
                  className={`w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Generate Video
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Creating video</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Video generation takes ~30-60 seconds
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {videoUrl && !isProcessing && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Video
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

            {/* Preview Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {!videoUrl ? (
                  /* Image Preview */
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Uploaded property"
                      className="w-full h-auto rounded-lg"
                    />
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      Original Photo
                    </div>
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg">
                        <div className="bg-white rounded-xl p-6 text-center shadow-xl">
                          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-3" />
                          <p className="font-medium text-gray-900">Generating video...</p>
                          <p className="text-sm text-gray-500">This may take 30-60 seconds</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Video Player */
                  <div className="relative">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-auto rounded-lg"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      Video Ready
                    </div>
                  </div>
                )}

                {/* Tips */}
                {videoUrl && (
                  <div className="mt-4 bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-700">
                      <strong>Tip:</strong> Videos are generated at 6fps for 6 seconds. 
                      Use the download button to save the MP4 file.
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
